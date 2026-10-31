// Supabase Edge Function: create-checkout-session
//
// Opens a Stripe Checkout session for one plan on the caller's *active workspace*, and returns the
// URL to send the browser to.
//
// Secrets required (Project → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_LAUNCH_MONTH / STRIPE_PRICE_GROWTH_MONTH / STRIPE_PRICE_SCALE_MONTH
//   STRIPE_PRICE_LAUNCH_YEAR  / STRIPE_PRICE_GROWTH_YEAR  / STRIPE_PRICE_SCALE_YEAR
//   (STRIPE_PRICE_LAUNCH / _GROWTH / _SCALE are also accepted for monthly billing)
//
// Auth: JWT verification stays ON, so the platform has already proven who the caller is. Only an
// owner or admin of the workspace may start a checkout for it, and a workspace that is already
// subscribed is sent to the billing portal instead of being double-charged.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

type Plan = 'launch' | 'growth' | 'scale';
type Interval = 'month' | 'year';

const PLANS: Plan[] = ['launch', 'growth', 'scale'];
const INTERVALS: Interval[] = ['month', 'year'];
const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];

/**
 * A new workspace is free for three days and no longer — Stripe is sent this exact number in
 * whole days, so nothing downstream can stretch it. The card is collected up front
 * (payment_method_collection=always), which is both what Stripe requires for a trial and what
 * makes the first charge land on day four instead of failing silently.
 *
 * Granted once per account, not once per workspace: the claim is recorded on the caller's
 * `profiles.trial_started_at`, so starting a second workspace does not buy a second trial. A
 * workspace that somehow already holds a subscription never gets one either.
 */
const TRIAL_DAYS = 3;

function userIdFrom(authorization: string | null): string | null {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  const payload = token?.split('.')[1];
  if (!payload) return null;

  try {
    const normalised = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalised));
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

function priceEnvName(plan: Plan, interval: Interval) {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${interval === 'year' ? 'YEAR' : 'MONTH'}`;
}

function priceId(plan: Plan, interval: Interval): string | null {
  const named = Deno.env.get(priceEnvName(plan, interval));
  if (named) return named;
  if (interval === 'month') return Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`) ?? null;
  return null;
}

function safeOrigin(candidate: unknown): string {
  const fallback = 'https://nexora-ai-employees.vercel.app';
  if (typeof candidate !== 'string') return fallback;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}

async function stripe(path: string, key: string, form: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, payload };
}

async function rest(path: string, serviceKey: string, init: RequestInit = {}) {
  const url = Deno.env.get('SUPABASE_URL');
  const response = await fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  return { ok: response.ok, rows: text ? (JSON.parse(text) as unknown) : null };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !serviceKey) {
    return json(
      { error: 'not_configured', missing: [!secret && 'STRIPE_SECRET_KEY', !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean) },
      501,
    );
  }

  let body: { plan?: unknown; interval?: unknown; origin?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const plan = PLANS.includes(body.plan as Plan) ? (body.plan as Plan) : null;
  const interval = INTERVALS.includes(body.interval as Interval) ? (body.interval as Interval) : 'month';
  if (!plan) return json({ error: 'unknown_plan' }, 400);

  const price = priceId(plan, interval);
  if (!price) {
    return json({ error: 'price_not_configured', missing: [priceEnvName(plan, interval)] }, 409);
  }

  const userId = userIdFrom(request.headers.get('authorization'));
  if (!userId) return json({ error: 'not_authenticated' }, 401);

  const profileResponse = await rest(
    `/profiles?id=eq.${userId}&select=active_workspace_id,company,trial_started_at`,
    serviceKey,
  );
  const profile = (
    profileResponse.rows as { active_workspace_id: string | null; trial_started_at: string | null }[] | null
  )?.[0];
  const workspaceId = profile?.active_workspace_id;
  if (!workspaceId) return json({ error: 'no_workspace' }, 409);

  const member = await rest(
    `/workspace_members?workspace_id=eq.${workspaceId}&user_id=eq.${userId}&select=role`,
    serviceKey,
  );
  const role = (member.rows as { role: string }[] | null)?.[0]?.role;
  if (role !== 'owner' && role !== 'admin') return json({ error: 'not_allowed' }, 403);

  const found = await rest(
    `/workspaces?id=eq.${workspaceId}&select=name,stripe_customer_id,stripe_subscription_id,subscription_status`,
    serviceKey,
  );
  const workspace = (
    found.rows as
      | {
          name: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
        }[]
      | null
  )?.[0];
  if (!workspace) return json({ error: 'no_workspace' }, 409);

  if (workspace.stripe_subscription_id && ACTIVE_STATUSES.includes(workspace.subscription_status ?? '')) {
    return json({ error: 'already_subscribed' }, 409);
  }

  // One trial per person for the life of the account: the flag lives on the profile, so a second
  // workspace is charged from its first invoice instead of handing out three more free days.
  const trialAvailable = !profile?.trial_started_at && !workspace.stripe_subscription_id;

  // One Stripe customer per workspace, created lazily and remembered on the row.
  let customerId = workspace.stripe_customer_id;
  if (!customerId) {
    const customerForm = new URLSearchParams({
      name: workspace.name,
      'metadata[workspace_id]': workspaceId,
      'metadata[user_id]': userId,
    });
    const created = await stripe('/customers', secret, customerForm);
    const id = (created.payload as { id?: string } | null)?.id;
    if (!created.ok || !id) {
      return json({ error: 'stripe_error', detail: (created.payload as { error?: { message?: string } } | null)?.error?.message ?? 'customer' }, 502);
    }
    customerId = id;
    await rest(`/workspaces?id=eq.${workspaceId}`, serviceKey, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ stripe_customer_id: customerId }),
    });
  }

  const origin = safeOrigin(body.origin);
  const metadata = { workspace_id: workspaceId, user_id: userId, plan, interval };

  // Every plan is recurring, so this is a subscription session. The two mode-specific parameters
  // further down follow this value instead of being hard-coded.
  const mode: 'payment' | 'subscription' = 'subscription';

  const form = new URLSearchParams({
    mode,
    // Hosted Checkout settings, as configured in Checkout Studio.
    ui_mode: 'hosted_page',
    billing_address_collection: 'auto',
    'phone_number_collection[enabled]': 'true',
    'automatic_tax[enabled]': 'false',
    allow_promotion_codes: 'false',
    integration_identifier: 'hosted_mobile_app_0001',
    origin_context: 'mobile_app',
    // Wiring this app cannot work without: which customer, which workspace, which plan.
    customer: customerId,
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    client_reference_id: workspaceId,
    success_url: `${origin}/dashboard/billing?checkout=success`,
    cancel_url: `${origin}/dashboard/billing?checkout=cancelled`,
    'subscription_data[metadata][workspace_id]': workspaceId,
    'subscription_data[metadata][user_id]': userId,
    'subscription_data[metadata][plan]': plan,
    'subscription_data[metadata][interval]': interval,
    'metadata[workspace_id]': workspaceId,
    'metadata[user_id]': userId,
    'metadata[plan]': plan,
    'metadata[interval]': interval,
  });

  if (mode === 'subscription') form.set('payment_method_collection', 'always');
  // Three days, or nothing at all — never more than TRIAL_DAYS.
  if (mode === 'subscription' && trialAvailable) {
    form.set('subscription_data[trial_period_days]', String(TRIAL_DAYS));
  }
  // Stripe refuses submit_type on any session that is not a one-time payment, so it is only sent
  // where it applies — the configured value survives if this flow ever sells a one-time product.
  if (mode === 'payment') form.set('submit_type', 'auto');

  const session = await stripe('/checkout/sessions', secret, form);
  const url = (session.payload as { url?: string } | null)?.url;
  if (!session.ok || !url) {
    return json(
      { error: 'stripe_error', detail: (session.payload as { error?: { message?: string } } | null)?.error?.message ?? 'session' },
      502,
    );
  }

  return json({ url, metadata, trialDays: trialAvailable && mode === 'subscription' ? TRIAL_DAYS : 0 });
});
