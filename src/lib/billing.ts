import type { Plan } from '@/data/site';
import { getSupabase } from './supabase';

export type CheckoutPlanId = Plan['id'];

/**
 * Opens a Stripe Checkout session for a plan.
 *
 * Returns `{ url }` when billing is wired up, and `{ error }` with copy the Billing page can show
 * otherwise — no Supabase, no `create-checkout-session` function, or no Stripe keys on the project.
 */
export async function startCheckout(
  plan: CheckoutPlanId,
): Promise<{ url: string } | { error: string }> {
  const pending = getSupabase();
  if (!pending) return { error: 'Billing is not connected in the local demo build.' };

  try {
    const db = await pending;
    const { data, error } = await db.functions.invoke('create-checkout-session', {
      body: { plan, origin: window.location.origin },
    });

    if (error) {
      return { error: 'Checkout is not available yet — the Stripe keys are missing on this project.' };
    }

    const url = (data as { url?: unknown } | null)?.url;
    if (typeof url !== 'string' || !url.startsWith('http')) {
      return { error: 'Checkout did not return a payment link.' };
    }

    return { url };
  } catch {
    return { error: 'Could not reach billing. Try again in a moment.' };
  }
}
