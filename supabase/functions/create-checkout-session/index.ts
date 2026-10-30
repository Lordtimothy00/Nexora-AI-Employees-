// Supabase Edge Function: create-checkout-session
//
// Creates a Stripe Checkout session for one of the three plans and returns its URL.
//
// Secrets required (Settings → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY, STRIPE_PRICE_LAUNCH, STRIPE_PRICE_GROWTH, STRIPE_PRICE_SCALE
//
// Without them the function answers 501 and the Billing page says billing is not connected.

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

function userIdFrom(authorization: string | null): string | null {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const normalised = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalised));
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const prices: Record<Plan, string | undefined> = {
    launch: Deno.env.get('STRIPE_PRICE_LAUNCH'),
    growth: Deno.env.get('STRIPE_PRICE_GROWTH'),
    scale: Deno.env.get('STRIPE_PRICE_SCALE'),
  };
  if (!secret) return json({ error: 'not_configured' }, 501);

  let body: { plan?: Plan; origin?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const plan = body.plan;
  if (!plan || !prices[plan]) return json({ error: 'unknown_plan' }, 400);

  const origin = (body.origin ?? '').replace(/\/+$/, '') || 'https://nexora-ai-employees.vercel.app';
  const userId = userIdFrom(request.headers.get('authorization'));

  const form = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': prices[plan] as string,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/dashboard/billing?checkout=success`,
    cancel_url: `${origin}/dashboard/billing?checkout=cancelled`,
    allow_promotion_codes: 'true',
    'metadata[plan]': plan,
    'subscription_data[metadata][plan]': plan,
  });
  if (userId) {
    form.set('client_reference_id', userId);
    form.set('metadata[user_id]', userId);
    form.set('subscription_data[metadata][user_id]', userId);
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });

    const session = await response.json();
    if (!response.ok) return json({ error: 'stripe_error', detail: session?.error?.message ?? 'unknown' }, 502);

    return json({ url: session.url, id: session.id });
  } catch (error) {
    return json({ error: 'stripe_unreachable', detail: String(error) }, 502);
  }
});
