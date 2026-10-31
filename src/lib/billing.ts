import type { Plan } from '@/data/site';
import { getSupabase } from './supabase';

/**
 * How long a new workspace is free. Stripe is told the same number by create-checkout-session, and
 * a card is collected up front, so this is a trial rather than a free tier: the first charge lands
 * when the three days are up.
 */
export const TRIAL_DAYS = 3;

export type CheckoutPlanId = Plan['id'];
export type BillingInterval = 'month' | 'year';

/** Which parts of Stripe configuration exist. Booleans only — no key or price value is returned. */
export interface BillingStatus {
  configured: boolean;
  webhook: boolean;
  prices: Record<string, Record<BillingInterval, boolean>>;
  missing: string[];
}

export interface BillingError {
  code: string;
  detail?: string;
  missing?: string[];
}

type Invoked<T> = { data: T | null; error: BillingError | null };

/**
 * Calls one of the billing functions and turns a non-2xx response into a typed error code.
 *
 * `functions.invoke` reports a 4xx/5xx as a generic FunctionsHttpError, so the useful part — our
 * `{ error, missing }` body — has to be read off the response it carries.
 */
async function invoke<T>(name: string, body: unknown): Promise<Invoked<T>> {
  const pending = getSupabase();
  if (!pending) return { data: null, error: { code: 'no_backend' } };

  try {
    const db = await pending;
    const { data, error } = await db.functions.invoke(name, { body: body as Record<string, unknown> });
    if (!error) return { data: (data as T) ?? null, error: null };

    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const payload = (await context.clone().json()) as {
          error?: string;
          detail?: string;
          missing?: string[];
        };
        if (payload?.error) {
          return { data: null, error: { code: payload.error, detail: payload.detail, missing: payload.missing } };
        }
      } catch {
        /* the body was not JSON; fall through to the generic message */
      }
    }

    return { data: null, error: { code: 'network' } };
  } catch {
    return { data: null, error: { code: 'network' } };
  }
}

/** Copy for every failure the billing functions can return. Plain, and never blames the user. */
export function explainBillingError(error: BillingError): string {
  const missing = error.missing?.length ? ` (${error.missing.join(', ')})` : '';

  switch (error.code) {
    case 'no_backend':
      return 'Billing runs on your Supabase project. This build has no backend configured, so there is nothing to charge.';
    case 'not_configured':
      return `Stripe is not connected on this project yet — its keys are missing${missing}.`;
    case 'price_not_configured':
      return `That plan has no Stripe price configured yet${missing}.`;
    case 'already_subscribed':
      return 'This workspace already has a subscription. Use Manage billing to change or cancel it.';
    case 'no_customer':
      return 'This workspace has no Stripe customer yet, so there is nothing to manage. Start with a plan first.';
    case 'no_workspace':
      return 'Open a workspace before changing billing.';
    case 'not_allowed':
      return 'Only workspace owners and admins can change billing.';
    case 'not_authenticated':
      return 'Your session has expired. Sign in again to continue.';
    case 'stripe_error':
      return 'Stripe rejected the request. Nothing was charged — try again in a moment.';
    case 'stripe_unreachable':
      return 'Stripe could not be reached. Nothing was charged — try again in a moment.';
    default:
      return 'Billing is unavailable right now. Nothing was charged.';
  }
}

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  const { data, error } = await invoke<BillingStatus>('billing-status', {});
  if (error || !data) return null;
  return data;
}

/**
 * Opens a Stripe Checkout session for a plan on the signed-in person's active workspace.
 *
 * Returns `{ url }` to redirect to, or `{ error }` with copy the Billing page can show — no keys on
 * the project, no price for that plan, an existing subscription, or a workspace-only permission.
 */
export async function startCheckout(
  plan: CheckoutPlanId,
  interval: BillingInterval = 'month',
): Promise<{ url: string } | { error: string }> {
  const { data, error } = await invoke<{ url?: unknown }>('create-checkout-session', {
    plan,
    interval,
    origin: window.location.origin,
  });

  if (error) return { error: explainBillingError(error) };

  const url = data?.url;
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    return { error: 'Checkout did not return a payment link. Nothing was charged.' };
  }
  return { url };
}

/** Stripe's hosted portal: cards, invoices, plan changes and cancellation all happen there. */
export async function openBillingPortal(): Promise<{ url: string } | { error: string }> {
  const { data, error } = await invoke<{ url?: unknown }>('billing-portal', {
    origin: window.location.origin,
  });

  if (error) return { error: explainBillingError(error) };

  const url = data?.url;
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    return { error: 'Stripe did not return a billing portal link. Try again in a moment.' };
  }
  return { url };
}
