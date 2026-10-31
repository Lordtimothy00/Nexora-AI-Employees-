# Stripe Checkout — integration status

This repository already created Stripe Checkout Sessions (`POST /v1/checkout/sessions` in
`supabase/functions/create-checkout-session`), so this pass changed **only the parameters of that
existing call** to match the Checkout Studio configuration. No new endpoint, no new files besides
this one, no refactoring.

This file is the single source of truth for what is left to do.

---

## Values to Replace

The session itself is wired for a real product (this app's three plans, monthly and annual), so the
`success_url`, `cancel_url` and `line_items` values are already the real ones — they are **not**
placeholders. What is still unset is the Stripe account's own identity: the secret key and the six
price IDs live in Supabase secrets and are currently absent, which is why the Billing page reports
"not configured" instead of opening Checkout.

**Files containing placeholders:**
- [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| `STRIPE_SECRET_KEY` (secret) | not set | Your test key `sk_test_…` from <https://dashboard.stripe.com/test/apikeys> (then `sk_live_…` when you go live). |
| `STRIPE_PRICE_LAUNCH_MONTH` (secret) | not set | Price ID for Launch, monthly ($12/mo). |
| `STRIPE_PRICE_LAUNCH_YEAR` (secret) | not set | Price ID for Launch, annual ($120/yr). |
| `STRIPE_PRICE_GROWTH_MONTH` (secret) | not set | Price ID for Growth, monthly ($55/mo). |
| `STRIPE_PRICE_GROWTH_YEAR` (secret) | not set | Price ID for Growth, annual ($528/yr). |
| `STRIPE_PRICE_SCALE_MONTH` (secret) | not set | Price ID for Scale, monthly ($199/mo). |
| `STRIPE_PRICE_SCALE_YEAR` (secret) | not set | Price ID for Scale, annual ($1,908/yr). |
| `subscription_data.trial_period_days` | `3` | Nothing to change — this is the 3-day trial, capped in code. See below if you want a shorter one. |
| `mode` | `subscription` | Already correct — all six prices are recurring. Change to `payment` only if you start selling a one-time product. |
| `success_url` | `${origin}/dashboard/billing?checkout=success` | Real value, kept as-is. `origin` is the caller's own origin, so it works on preview and production. |
| `cancel_url` | `${origin}/dashboard/billing?checkout=cancelled` | Real value, kept as-is. |
| `line_items[0][price]` | resolved from the secrets above | Set per plan/interval by the request (`{ plan, interval }`), never hard-coded in the bundle. |

`STRIPE_PRICE_LAUNCH` / `_GROWTH` / `_SCALE` are also accepted as fallbacks for the monthly IDs.

---

## Configured Parameters

These were configured in Checkout Studio and are now set on the session.

**Files containing these parameters:**
- [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts)

| Parameter | Value |
|-----------|-------|
| `ui_mode` | `hosted_page` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `true` |
| `automatic_tax.enabled` | `false` |
| `allow_promotion_codes` | `false` |
| `payment_method_collection` | `always` — sent only when `mode` is `subscription`, which it is here |
| `submit_type` | `auto` — **only sent when `mode` is `payment`.** Stripe rejects `submit_type` on subscription and setup sessions, so with this app's recurring plans it is deliberately not on the wire. The value is kept in the function so it applies if a one-time product is ever sold. |
| `integration_identifier` | `hosted_mobile_app_0001` |
| `origin_context` | `mobile_app` |
| `subscription_data.trial_period_days` | `3` — a new account is free for exactly three days, once |
| `payment_method_collection` | `always` — required for a trial, and why a card is taken up front |

**Preserved wiring (not Checkout Studio settings, but this app cannot run without them):**
`customer`, `client_reference_id`, `metadata.*` and `subscription_data.metadata.*`. The
`stripe-webhook` function reads `subscription.metadata.workspace_id`, `plan` and `interval` to
decide which workspace is upgraded to which plan; `customer` is the one Stripe customer kept per
workspace (`workspaces.stripe_customer_id`) and is what the billing portal opens. Removing them
would take the money and never change the plan.

**The 3-day trial:** it belongs to the *account*, not the workspace. `profiles.trial_started_at` is
the claim: `stripe-webhook` stamps it the first time a subscription with a `trial_end` arrives for
that `user_id`, and `create-checkout-session` only asks Stripe for trial days while the column is
null. So one person gets one trial across every workspace they ever create, and cancelling does not
re-open it. Stripe enforces the length because the number is sent on the session, not read from the
dashboard. If you
want a *shorter* trial, change `TRIAL_DAYS` in
[supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts)
and `TRIAL_DAYS` in [src/lib/billing.ts](src/lib/billing.ts) together and redeploy both the function
and the site; do not go above 3 — the product and the marketing pages both promise three days, and
`src/test/app.test.tsx` fails if the UI constant changes.

If you configure a trial on the *price* in the Stripe dashboard it is ignored here, because the
session parameter wins. Leave the price's own trial at zero so there is only one place that decides.

**Where the trial claim lives:** `profiles.trial_started_at`, written only by `stripe-webhook` (the
service role). The column is excluded from the client's Postgres grants, so nobody can clear it from
a browser session and start a second trial. The `workspace_billing()` RPC returns it alongside the
workspace fields so Billing can hide the trial offer once it is spent.

**`ui_mode` version note:** `hosted_page` is what the current Stripe API versions accept (`hosted`
was the older spelling, and `custom` was replaced by `elements`). This project talks to
`api.stripe.com` directly with no SDK and pins no `Stripe-Version` header on purpose, so the
account's default API version decides. If your account's default version predates `hosted_page`,
Stripe returns `Received unknown parameter: ui_mode` (or an invalid-value error) — change the single
string to `'hosted'` in `create-checkout-session/index.ts` and redeploy.

---

## Setup and next steps

### 1. Set the secrets (server-side only)

Project → Edge Functions → Secrets (or `supabase secrets set`):

```
STRIPE_SECRET_KEY=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…            # step 3
STRIPE_PRICE_LAUNCH_MONTH=price_…
STRIPE_PRICE_LAUNCH_YEAR=price_…
STRIPE_PRICE_GROWTH_MONTH=price_…
STRIPE_PRICE_GROWTH_YEAR=price_…
STRIPE_PRICE_SCALE_MONTH=price_…
STRIPE_PRICE_SCALE_YEAR=price_…
```

Naming: every Stripe value here is **server-only** and must never be exposed to the browser, so none
of them carry the `VITE_` prefix. Hosted Checkout needs no publishable key at all — the browser only
receives the `checkout.stripe.com` URL, so there is nothing to add to `.env.example` / Vercel.
`billing-status` reports which of these names are still missing, by name, on the Billing page.

Create the six prices in the Dashboard (<https://dashboard.stripe.com/prices>) as **recurring**
prices (monthly and yearly) on three products, or with the API. The Billing page and the plan cards
already show those amounts.

### 2. How the flow works

1. A signed-in owner or admin presses a plan button on **Dashboard → Billing**.
2. `create-checkout-session` verifies the JWT, resolves the caller's *active workspace*, checks
   they are owner/admin, refuses a workspace that is already subscribed, and creates (once) the
   Stripe customer stored on `workspaces.stripe_customer_id`.
3. It opens a hosted Checkout Session with the studio parameters above and returns `{ url }`.
4. The browser is redirected to that URL; card details are entered on Stripe's page and never
   touch this app or its database.
5. Stripe returns the customer to `/dashboard/billing?checkout=success` (or `…=cancelled`).
6. `stripe-webhook` (JWT verification **off**, signature verified instead) applies
   `checkout.session.completed` and `customer.subscription.*` and writes the plan onto the
   workspace. It is the only writer of a workspace's plan.

### 3. Webhook

Stripe → Developers → Webhooks → add endpoint
`https://akdduxuymbutovxwszla.supabase.co/functions/v1/stripe-webhook`, subscribed to
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.payment_failed`. Copy the signing secret into
`STRIPE_WEBHOOK_SECRET`.

### 4. Test it

Test mode only until the live keys are in:

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | succeeds |
| `4000 0000 0000 3220` | 3D Secure required (complete the challenge) |
| `4000 0000 0000 9995` | declined (insufficient funds) |
| any future expiry, any CVC, any postcode | |

After a successful test payment, confirm the workspace's plan changed on the Billing page and that
`stripe_events` has the event row. Re-delivering the same event from the Stripe dashboard must be a
no-op — that is what the event-id table is for.

### 5. Still to do before going live

- Swap `sk_test_…` for `sk_live_…`, recreate the six prices in live mode, point the webhook at the
  live signing secret.
- Check the trial after your first test payment: the Billing page should read *Free trial ends
  <date>*, the badge should say *Trial*, and Stripe should show a `trialing` subscription whose
  trial end is exactly 3 days out.
- Turn `automatic_tax` on (and set a tax behaviour on the prices) if you need tax collected — today
  it is `false`, matching the studio configuration.
- Promotion codes are off (`allow_promotion_codes: false`). Flip it to `true` if you want them.
- Fulfilment is already handled by the webhook, but nothing emails a receipt or a welcome note; that
  is app work, not Stripe work.

### Resources

- Stripe support: <https://support.stripe.com>
- Stripe docs (MCP / API reference): <https://docs.stripe.com/mcp>
- Checkout Session parameters: <https://docs.stripe.com/api/checkout/sessions/create>
