// Supabase Edge Function: stripe-webhook
//
// The only thing that is allowed to write a workspace's plan. Stripe signs every delivery, the
// signature is verified here with a five-minute tolerance, and each event id is recorded once so a
// retried delivery cannot apply twice.
//
// Endpoint (Stripe → Developers → Webhooks): https://<project>.supabase.co/functions/v1/stripe-webhook
// Events: checkout.session.completed, customer.subscription.created/updated/deleted,
//         invoice.payment_failed
//
// Secrets required: STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY.
// Deploy with JWT verification OFF — Stripe cannot send a Supabase JWT; the signature is the
// authentication.

const encoder = new TextEncoder();
const TOLERANCE_SECONDS = 300;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

type Plan = 'launch' | 'growth' | 'scale';
const PLANS: Plan[] = ['launch', 'growth', 'scale'];

type Subscription = {
  id?: string;
  customer?: string;
  status?: string;
  current_period_end?: number;
  trial_end?: number;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, string | undefined>;
  items?: {
    data?: {
      current_period_end?: number;
      price?: { id?: string; recurring?: { interval?: string } };
    }[];
  };
};

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time-ish comparison: always walks the full string. */
function equals(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signatureValid(payload: string, header: string | null, secret: string) {
  if (!header) return false;

  const parts = header.split(',').reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split('=');
    if (!key || !value) return acc;
    (acc[key.trim()] ??= []).push(value.trim());
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const expected = hex(digest);
  return signatures.some((candidate) => equals(candidate, expected));
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
  return { status: response.status, rows: text ? (JSON.parse(text) as unknown) : null };
}

/** Which plan a Stripe price id belongs to, matching the env vars the checkout function uses. */
function planForPrice(price: string | undefined): Plan | null {
  if (!price) return null;
  for (const plan of PLANS) {
    for (const suffix of ['MONTH', 'YEAR']) {
      if (Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}_${suffix}`) === price) return plan;
    }
    if (Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`) === price) return plan;
  }
  return null;
}

function workspaceFromMetadata(subscription: Subscription) {
  return subscription.metadata?.workspace_id ?? null;
}

/**
 * The 3-day trial belongs to the person, so the first trial any account starts burns its one free
 * run — whichever workspace it happened in. Written only if it is still empty, so a later
 * subscription cannot move the date or re-open the trial after a cancellation.
 */
async function markTrialUsed(subscription: Subscription, serviceKey: string) {
  const userId = subscription.metadata?.user_id;
  if (!userId || !subscription.trial_end) return;

  await rest(`/profiles?id=eq.${userId}&trial_started_at=is.null`, serviceKey, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ trial_started_at: new Date().toISOString() }),
  });
}

async function applySubscription(subscription: Subscription, serviceKey: string) {
  const price = subscription.items?.data?.[0]?.price;
  const planFromMetadata = subscription.metadata?.plan;
  const plan = PLANS.includes(planFromMetadata as Plan)
    ? (planFromMetadata as Plan)
    : planForPrice(price?.id);

  // Newer Stripe API versions moved the period end onto the subscription item; older ones still
  // carry it at the top level. Without the fallback a trialing workspace would have no date to
  // show for the end of its three days.
  const periodEndSeconds =
    subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;

  const patch: Record<string, unknown> = {
    stripe_subscription_id: subscription.id ?? null,
    stripe_customer_id: subscription.customer ?? null,
    subscription_status: subscription.status ?? null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    billing_interval: price?.recurring?.interval ?? subscription.metadata?.interval ?? null,
    current_period_end: periodEndSeconds
      ? new Date(periodEndSeconds * 1000).toISOString()
      : null,
  };

  // A cancelled or unpaid subscription keeps existing but stops granting a plan.
  const live = ['active', 'trialing', 'past_due'].includes(subscription.status ?? '');
  patch.plan = live && plan ? plan : null;

  const workspaceId = workspaceFromMetadata(subscription);
  const target = workspaceId
    ? `/workspaces?id=eq.${workspaceId}`
    : `/workspaces?stripe_customer_id=eq.${subscription.customer ?? ''}`;

  const result = await rest(target, serviceKey, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });

  await markTrialUsed(subscription, serviceKey);

  const updated = Array.isArray(result.rows) ? result.rows.length : 0;
  return { ok: result.status >= 200 && result.status < 300 && updated > 0, updated };
}

async function markPastDue(customer: string | undefined, subscriptionId: string | undefined, serviceKey: string) {
  const target = subscriptionId
    ? `/workspaces?stripe_subscription_id=eq.${subscriptionId}`
    : `/workspaces?stripe_customer_id=eq.${customer ?? ''}`;
  const result = await rest(target, serviceKey, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ subscription_status: 'past_due' }),
  });
  return result.status >= 200 && result.status < 300;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !serviceKey) {
    return json({ error: 'not_configured', missing: [!secret && 'STRIPE_WEBHOOK_SECRET', !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean) }, 501);
  }

  const payload = await request.text();
  if (!(await signatureValid(payload, request.headers.get('stripe-signature'), secret))) {
    return json({ error: 'invalid_signature' }, 400);
  }

  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: 'bad_payload' }, 400);
  }

  if (!event.id || !event.type) return json({ error: 'bad_payload' }, 400);

  // Record first: a duplicate delivery is a no-op with 200, so Stripe stops retrying it.
  const recorded = await rest('/stripe_events', serviceKey, {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ id: event.id, type: event.type }),
  });
  if (Array.isArray(recorded.rows) && recorded.rows.length === 0) {
    return json({ received: true, duplicate: true });
  }

  const object = (event.data?.object ?? {}) as Record<string, unknown>;

  switch (event.type) {
    case 'checkout.session.completed': {
      const subscriptionId = typeof object.subscription === 'string' ? object.subscription : null;
      if (!subscriptionId || !stripeKey) break;

      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      const subscription = (await response.json().catch(() => null)) as Subscription | null;
      if (response.ok && subscription) await applySubscription(subscription, serviceKey);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await applySubscription(object as Subscription, serviceKey);
      break;
    }

    case 'invoice.payment_failed': {
      await markPastDue(
        typeof object.customer === 'string' ? object.customer : undefined,
        typeof object.subscription === 'string' ? object.subscription : undefined,
        serviceKey,
      );
      break;
    }

    default:
      break;
  }

  return json({ received: true });
}); 
