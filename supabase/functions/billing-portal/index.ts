// Supabase Edge Function: billing-portal
//
// Returns a Stripe-hosted Billing Portal URL for the caller's active workspace: update the card,
// change plan, download invoices, or cancel. Card details never touch this app.
//
// Secrets required: STRIPE_SECRET_KEY (and SUPABASE_SERVICE_ROLE_KEY, provided by the platform).
// Auth: JWT verification ON; owner or admin of the workspace only.

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

async function rest(path: string, serviceKey: string) {
  const url = Deno.env.get('SUPABASE_URL');
  const response = await fetch(`${url}/rest/v1${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
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
  if (!secret || !serviceKey) return json({ error: 'not_configured' }, 501);

  let body: { origin?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    /* an empty body is fine — the return URL just falls back to production */
  }

  const userId = userIdFrom(request.headers.get('authorization'));
  if (!userId) return json({ error: 'not_authenticated' }, 401);

  const profile = await rest(`/profiles?id=eq.${userId}&select=active_workspace_id`, serviceKey);
  const workspaceId = (profile.rows as { active_workspace_id: string | null }[] | null)?.[0]?.active_workspace_id;
  if (!workspaceId) return json({ error: 'no_workspace' }, 409);

  const member = await rest(
    `/workspace_members?workspace_id=eq.${workspaceId}&user_id=eq.${userId}&select=role`,
    serviceKey,
  );
  const role = (member.rows as { role: string }[] | null)?.[0]?.role;
  if (role !== 'owner' && role !== 'admin') return json({ error: 'not_allowed' }, 403);

  const found = await rest(`/workspaces?id=eq.${workspaceId}&select=stripe_customer_id`, serviceKey);
  const customer = (found.rows as { stripe_customer_id: string | null }[] | null)?.[0]?.stripe_customer_id;
  if (!customer) return json({ error: 'no_customer' }, 409);

  const form = new URLSearchParams({
    customer,
    return_url: `${safeOrigin(body.origin)}/dashboard/billing`,
  });

  try {
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
    const session = await response.json().catch(() => null);
    const url = (session as { url?: string } | null)?.url;
    if (!response.ok || !url) {
      return json(
        { error: 'stripe_error', detail: (session as { error?: { message?: string } } | null)?.error?.message ?? 'portal' },
        502,
      );
    }
    return json({ url });
  } catch (error) {
    return json({ error: 'stripe_unreachable', detail: String(error) }, 502);
  }
});
