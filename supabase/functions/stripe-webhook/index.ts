// Supabase Edge Function: stripe-webhook
//
// Keeps `profiles.plan` in step with Stripe. Point a Stripe webhook at this function for
// `checkout.session.completed` and `customer.subscription.deleted`.
//
// Secret required: STRIPE_WEBHOOK_SECRET (the `whsec_…` value from the endpoint).
// Deploy with JWT verification OFF — Stripe cannot send a Supabase JWT; the signature is
// the authentication.

const encoder = new TextEncoder();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function validSignature(payload: string, header: string | null, secret: string) {
  if (!header) return false;

  const parts = header.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return hex === signature;
}

async function setPlan(userId: string | undefined, plan: string | undefined) {
  if (!userId || !plan || !['launch', 'growth', 'scale'].includes(plan)) return false;

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return false;

  const response = await fetch(`${url}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ plan }),
  });

  return response.ok;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) return json({ error: 'not_configured' }, 501);

  const payload = await request.text();
  if (!(await validSignature(payload, request.headers.get('stripe-signature'), secret))) {
    return json({ error: 'invalid_signature' }, 400);
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return json({ error: 'bad_payload' }, 400);
  }

  const object = event.data?.object ?? {};
  const metadata = (object.metadata ?? {}) as Record<string, string | undefined>;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = metadata.user_id ?? (object.client_reference_id as string | undefined);
      await setPlan(userId, metadata.plan);
      break;
    }
    case 'customer.subscription.deleted': {
      await setPlan(metadata.user_id, 'launch');
      break;
    }
    default:
      break;
  }

  return json({ received: true });
});
