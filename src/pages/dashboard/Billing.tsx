import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, CreditCard, ReceiptText, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, Panel, Toast } from '@/components/dashboard/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { plans, type Plan } from '@/data/site';
import { fetchWorkspaceBilling, type WorkspaceBilling } from '@/lib/backend';
import {
  fetchBillingStatus,
  openBillingPortal,
  startCheckout,
  type BillingInterval,
  type BillingStatus,
  type CheckoutPlanId,
} from '@/lib/billing';
import { backendConfigured } from '@/lib/supabase';
import { cn, currency } from '@/lib/utils';

/** What each plan includes, used only to draw the usage meters for a plan Stripe confirmed. */
const LIMITS: Record<Plan['id'], { tasks: number; seats: number }> = {
  launch: { tasks: 500, seats: 1 },
  growth: { tasks: 4000, seats: 5 },
  scale: { tasks: 100000, seats: 999 },
};

function statusBadge(billing: WorkspaceBilling) {
  switch (billing.status) {
    case 'active':
      return { text: 'Active', tone: 'border-[#0bd39a]/30 bg-[#0bd39a]/12 text-[#9df7c2]' };
    case 'trialing':
      return { text: 'Trial', tone: 'border-[#0bd39a]/30 bg-[#0bd39a]/12 text-[#9df7c2]' };
    case 'past_due':
    case 'unpaid':
      return { text: 'Payment failed', tone: 'border-rose-400/30 bg-rose-500/10 text-[#f0b4b4]' };
    case 'canceled':
      return { text: 'Cancelled', tone: 'border-white/15 bg-white/[0.06] text-[#c7d4d6]' };
    default:
      return { text: billing.status ?? 'No subscription', tone: 'border-white/15 bg-white/[0.06] text-[#c7d4d6]' };
  }
}

export function Billing() {
  const { user } = useAuth();
  const { hires, completedThisMonth, activeWorkspace } = useWorkspace();

  // The local demo account has no workspaces table behind it, so nothing here can be billed.
  const remote = backendConfigured && !!user && !user.id.startsWith('usr_');

  const [billing, setBilling] = useState<WorkspaceBilling | null>(null);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<CheckoutPlanId | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const handledReturn = useRef(false);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4200);
  };

  const load = useCallback(async () => {
    if (!remote) {
      setLoading(false);
      return;
    }
    const [nextBilling, nextStatus] = await Promise.all([
      fetchWorkspaceBilling().catch(() => null),
      fetchBillingStatus(),
    ]);
    setBilling(nextBilling);
    setStatus(nextStatus);
    setLoading(false);
  }, [remote]);

  useEffect(() => {
    void load();
  }, [load]);

  // Coming back from Stripe: the webhook is the source of truth and can land seconds later, so
  // poll briefly instead of claiming a plan we have not been told about.
  useEffect(() => {
    const outcome = searchParams.get('checkout');
    if (!outcome || handledReturn.current) return;
    handledReturn.current = true;

    searchParams.delete('checkout');
    setSearchParams(searchParams, { replace: true });

    if (outcome !== 'success') {
      showToast('Checkout cancelled. Nothing was charged.');
      return;
    }

    setConfirming(true);
    void (async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const next = await fetchWorkspaceBilling().catch(() => null);
        if (next?.plan) {
          setBilling(next);
          setConfirming(false);
          showToast(`Stripe confirmed your subscription. You are on the ${next.plan} plan.`);
          return;
        }
      }
      setConfirming(false);
      showToast('Payment submitted, but Stripe has not confirmed it yet. Refresh in a moment.');
    })();
  }, [searchParams, setSearchParams]);

  const beginCheckout = async (planId: CheckoutPlanId) => {
    setCheckingOut(planId);
    const result = await startCheckout(planId, interval);
    if ('url' in result) {
      window.location.assign(result.url);
      return;
    }
    setCheckingOut(null);
    showToast(result.error);
  };

  const manageBilling = async () => {
    setPortalBusy(true);
    const result = await openBillingPortal();
    setPortalBusy(false);
    if ('url' in result) {
      window.location.assign(result.url);
      return;
    }
    showToast(result.error);
  };

  const currentPlan = billing?.plan ? plans.find((plan) => plan.id === billing.plan) ?? null : null;
  const limits = currentPlan ? LIMITS[currentPlan.id] : null;
  const badge = billing ? statusBadge(billing) : null;
  const periodEnd = billing?.periodEnd
    ? new Date(billing.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const perMonth = currentPlan
    ? billing?.interval === 'year'
      ? currentPlan.annual
      : currentPlan.monthly
    : 0;
  const priceReady = (planId: CheckoutPlanId) => status?.prices?.[planId]?.[interval] ?? false;
  const checkoutEnabled = remote && Boolean(status?.configured);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const webhookUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/stripe-webhook` : null;
  const setupIncomplete = remote && Boolean(status?.missing.length);
  const isOwner = activeWorkspace?.role === 'owner';

  const usage = limits
    ? [
        {
          label: 'Tasks delivered this cycle',
          value: completedThisMonth,
          total: limits.tasks,
        },
        { label: 'Employee seats', value: hires.length, total: limits.seats },
      ]
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Billing"
        description="What Stripe has confirmed for this workspace — nothing is estimated."
        actions={
          <ButtonLink to="/pricing" size="sm" variant="secondary" iconRight={<ArrowUpRight className="size-3.5" />}>
            Compare plans
          </ButtonLink>
        }
      />

      {(!remote || (status && !status.configured)) && (
        <div className="flex items-start gap-2.5 rounded-[18px] border border-white/12 bg-white/[0.045] p-3.5 backdrop-blur-xl">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#9df7c2]" />
          <div>
            <p className="text-[11.5px] font-medium text-white">
              {remote ? 'Stripe is not connected on this project yet' : 'Stripe is not connected in this build'}
            </p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#9aaab3]">
              {remote ? (
                <>
                  Checkout stays disabled until the Edge Function secrets exist. Missing:{' '}
                  <span className="font-mono text-[11px] text-[#d8e4e4]">
                    {status?.missing.length ? status.missing.join(', ') : 'unknown'}
                  </span>
                  .
                </>
              ) : (
                'The local demo workspace has no backend, so no card is collected and no plan exists to show.'
              )}
            </p>
          </div>
        </div>
      )}

      {setupIncomplete && isOwner && (
        <Panel title="Finish Stripe setup" subtitle="Owner only — disappears once every secret exists">
          <p className="text-[11px] leading-relaxed text-[#aabbc2]">
            Add these as Edge Function secrets (Supabase → Project Settings → Edge Functions → Secrets).
            They live on the server only; nothing here reaches the browser.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {status?.missing.map((name) => (
              <span
                key={name}
                className="rounded-md border border-white/12 bg-white/[0.05] px-2 py-1 font-mono text-[10px] text-[#d8e4e4]"
              >
                {name}
              </span>
            ))}
          </div>

          {!status?.webhook && webhookUrl && (
            <div className="mt-3 rounded-lg border border-white/12 bg-white/[0.03] p-3">
              <p className="text-[11px] font-medium text-white">Webhook endpoint</p>
              <p className="mt-1 break-all font-mono text-[10.5px] text-[#9df7c2]">{webhookUrl}</p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#9aaab3]">
                In Stripe → Developers → Webhooks, add that URL and send{' '}
                <span className="font-mono">checkout.session.completed</span>,{' '}
                <span className="font-mono">customer.subscription.created</span>,{' '}
                <span className="font-mono">.updated</span>, <span className="font-mono">.deleted</span> and{' '}
                <span className="font-mono">invoice.payment_failed</span>. Copy the signing secret it shows
                into <span className="font-mono">STRIPE_WEBHOOK_SECRET</span>.
              </p>
            </div>
          )}

          <p className="mt-2.5 text-[10px] leading-relaxed text-[#8d9ea7]">
            Nothing is charged while any of these are missing: checkout refuses before it reaches Stripe.
          </p>
        </Panel>
      )}

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Current plan"
          subtitle={
            currentPlan
              ? billing?.cancelAtPeriodEnd && periodEnd
                ? `Ends ${periodEnd}`
                : periodEnd
                  ? `Renews ${periodEnd}`
                  : 'Managed by Stripe'
              : 'No subscription yet'
          }
        >
          {loading ? (
            <p className="text-[12px] text-[#9aaab3]">Checking with Stripe…</p>
          ) : confirming ? (
            <div className="rounded-xl border border-[#0bd39a]/25 bg-[#0bd39a]/[0.06] p-4">
              <p className="text-[12px] font-medium text-white">Confirming your payment with Stripe…</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-[#a9bbc0]">
                The plan appears here as soon as Stripe&apos;s webhook lands — usually a few seconds.
              </p>
            </div>
          ) : currentPlan && billing ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-[22px] font-semibold text-white">{currentPlan.name}</h2>
                  <span className={cn('rounded-full border px-2 py-0.5 text-[9.5px] uppercase tracking-wider', badge?.tone)}>
                    {badge?.text}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#aabbc2]">{currentPlan.description}</p>
                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-[30px] font-semibold leading-none text-white">{currency(perMonth)}</span>
                  <span className="text-[12px] text-[#aabbc2]">/ month{billing.interval === 'year' ? ', billed yearly' : ''}</span>
                </p>
                {billing.cancelAtPeriodEnd && (
                  <p className="mt-2 text-[10.5px] text-[#e8c8a1]">
                    Cancels at the end of the period. You keep access until {periodEnd ?? 'then'}.
                  </p>
                )}
                {billing.status === 'past_due' && (
                  <p className="mt-2 text-[10.5px] text-[#f0b4b4]">
                    Stripe could not charge the card. Update it in the billing portal to keep the plan.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" loading={portalBusy} disabled={!billing.hasCustomer} onClick={manageBilling}>
                  Manage billing
                </Button>
                <p className="max-w-[180px] text-[10px] leading-relaxed text-[#8d9ea7]">
                  Change plan, update the card or cancel inside Stripe.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[13px] font-medium text-white">No plan yet</p>
              <p className="mt-1 max-w-[420px] text-[11.5px] leading-relaxed text-[#aabbc2]">
                This workspace has never been through checkout, so there is no plan, no renewal date and no
                invoice to show. Pick one below when you are ready.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Choose a plan
              </Button>
            </div>
          )}

          {usage.length > 0 && (
            <div className="mt-5 space-y-4 border-t border-white/12 pt-4">
              {usage.map((row) => {
                const percent = Math.min(100, (row.value / Math.max(row.total, 1)) * 100);
                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#b9c9cf]">{row.label}</span>
                      <span className="font-mono text-[#d8e4e4]">
                        {row.value.toLocaleString()} / {row.total >= 100000 ? '∞' : row.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#2fe3b0,#078a63)]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-[#8d9ea7]">
                Counted from this workspace&apos;s own tasks and hires, not from a billing estimate.
              </p>
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Payment method">
            <div className="rounded-xl border border-white/12 bg-white/[0.03] p-4">
              <CreditCard className="size-5 text-[#9df7c2]" />
              <p className="mt-3 text-[12px] font-medium text-white">
                {billing?.hasCustomer ? 'Card held by Stripe' : 'No card on file'}
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-[#aabbc2]">
                {billing?.hasCustomer
                  ? 'Nexora never sees or stores card details. Stripe is the only place they live.'
                  : 'Stripe asks for a card when you start a plan. Nothing is collected here.'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              disabled={!billing?.hasCustomer}
              loading={portalBusy}
              onClick={manageBilling}
            >
              Update payment method
            </Button>
          </Panel>

          <Panel title="What we store">
            <div className="space-y-3">
              {[
                { label: 'Provider', value: 'Stripe' },
                { label: 'On this page', value: 'Plan · status · renewal' },
                { label: 'Card details', value: 'Stripe only' },
                { label: 'Invoice history', value: 'Stripe portal' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-[11px] text-[#9aaab3]">{row.label}</span>
                  <span className="text-[11px] font-medium text-[#d8e4e4]">{row.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Invoices"
        subtitle={billing?.hasCustomer ? 'Held by Stripe' : 'Nothing has been charged'}
        padded={false}
      >
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#2fe3b0]">
            <ReceiptText className="size-4" />
          </span>
          <p className="mt-3 font-display text-[13.5px] font-semibold text-white">No invoices yet</p>
          <p className="mt-1 max-w-[340px] text-[11.5px] leading-relaxed text-[#aabbc2]">
            Invoices appear only after Stripe confirms a payment. Nothing on this page is modelled or
            generated — receipts for real charges live in Stripe&apos;s billing portal.
          </p>
          {billing?.hasCustomer && (
            <Button variant="secondary" size="sm" className="mt-3" loading={portalBusy} onClick={manageBilling}>
              Open invoice history
            </Button>
          )}
        </div>
      </Panel>

      <div id="plans" className="scroll-mt-6">
        <Panel title="Available plans" subtitle="Cancel or change any time — Stripe handles the proration">
          <div className="mb-3 inline-flex rounded-full border border-white/12 bg-white/[0.04] p-0.5">
            {(['month', 'year'] as BillingInterval[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={interval === value}
                onClick={() => setInterval(value)}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] transition',
                  interval === value ? 'bg-white/[0.1] text-white' : 'text-[#9aaab3] hover:text-white',
                )}
              >
                {value === 'month' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan?.id;
              const price = interval === 'year' ? plan.annual : plan.monthly;
              const ready = priceReady(plan.id);
              const blocked = !checkoutEnabled || !ready;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'rounded-xl border p-4',
                    isCurrent
                      ? 'border-[#0bd39a]/40 bg-[#0bd39a]/[0.07]'
                      : 'border-white/12 bg-white/[0.045] backdrop-blur-xl',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-white">{plan.name}</p>
                    {isCurrent && (
                      <span className="rounded-full bg-[#0bd39a]/20 px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider text-[#9df7c2]">
                        current
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-display text-[20px] font-semibold text-white">
                    {currency(price)}
                    <span className="ml-1 text-[10px] font-normal text-[#9aaab3]">/mo</span>
                  </p>
                  {interval === 'year' && (
                    <p className="mt-0.5 text-[10px] text-[#8d9ea7]">{currency(price * 12)} billed yearly</p>
                  )}
                  <p className="mt-1 text-[10px] text-[#a7b7be]">{plan.employeeLimit}</p>

                  {isCurrent ? (
                    <Button variant="ghost" size="sm" className="mt-3 w-full" disabled>
                      <Check className="mr-1 size-3.5" /> Current plan
                    </Button>
                  ) : billing?.plan ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3 w-full"
                      disabled={!billing.hasCustomer}
                      loading={portalBusy}
                      onClick={manageBilling}
                    >
                      Change in Stripe
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3 w-full"
                      disabled={blocked}
                      loading={checkingOut === plan.id}
                      onClick={() => beginCheckout(plan.id)}
                    >
                      {ready || !status ? `Choose ${plan.name}` : 'Price not configured'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.045] px-3 py-2 backdrop-blur-xl">
            <ReceiptText className="size-3.5 shrink-0 text-[#a7b7be]" />
            <p className="text-[10px] text-[#9aaab3]">
              {status?.configured
                ? 'Payments run through Stripe in test mode until live keys are set. This page only shows what Stripe has confirmed.'
                : 'Checkout is disabled until the Stripe keys and price IDs are set on this project.'}
            </p>
          </div>
        </Panel>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
