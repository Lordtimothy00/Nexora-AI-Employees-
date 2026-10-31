// Supabase Edge Function: billing-status
//
// Tells the Billing page which pieces of Stripe configuration exist, so the page can be honest
// about what is and is not wired up. It returns booleans only — never a key or a price value.
//
// Nothing here is secret; a signed-in user seeing "STRIPE_PRICE_SCALE_YEAR is missing" is exactly
// the message the workspace owner needs.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const PLANS = ['launch', 'growth', 'scale'] as const;
const INTERVALS = ['month', 'year'] as const;

/** Monthly prices also accept the older `STRIPE_PRICE_GROWTH` name. */
function hasPrice(plan: string, interval: string) {
  const suffix = interval === 'year' ? 'YEAR' : 'MONTH';
  if (Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}_${suffix}`)) return true;
  return interval === 'month' && Boolean(Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`));
}

Deno.serve((request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const missing: string[] = [];
  if (!Deno.env.get('STRIPE_SECRET_KEY')) missing.push('STRIPE_SECRET_KEY');
  if (!Deno.env.get('STRIPE_WEBHOOK_SECRET')) missing.push('STRIPE_WEBHOOK_SECRET');

  const prices = Object.fromEntries(
    PLANS.map((plan) => [
      plan,
      Object.fromEntries(INTERVALS.map((interval) => [interval, hasPrice(plan, interval)])),
    ]),
  ) as Record<string, Record<string, boolean>>;

  for (const plan of PLANS) {
    for (const interval of INTERVALS) {
      if (!prices[plan][interval]) {
        missing.push(`STRIPE_PRICE_${plan.toUpperCase()}_${interval === 'year' ? 'YEAR' : 'MONTH'}`);
      }
    }
  }

  return json({
    // Checkout works as soon as the key and a monthly price for that plan exist; the webhook is
    // what actually records the subscription, so a missing webhook secret is reported separately.
    configured: Boolean(Deno.env.get('STRIPE_SECRET_KEY')) && Object.values(prices).some((p) => p.month),
    webhook: Boolean(Deno.env.get('STRIPE_WEBHOOK_SECRET')),
    prices,
    missing,
  });
});
