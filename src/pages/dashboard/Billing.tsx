import { useState } from 'react';
import { ArrowUpRight, Check, CreditCard, Download, ReceiptText, Sparkles } from 'lucide-react';
import { PageHeader, Panel, Toast } from '@/components/dashboard/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { plans } from '@/data/site';
import { downloadFile } from '@/lib/download';
import { cn, currency } from '@/lib/utils';

const invoices = [
  { id: 'INV-2041', date: 'Oct 1, 2026', amount: 149, status: 'Paid' },
  { id: 'INV-1988', date: 'Sep 1, 2026', amount: 149, status: 'Paid' },
  { id: 'INV-1934', date: 'Aug 1, 2026', amount: 149, status: 'Paid' },
];

export function Billing() {
  const { user } = useAuth();
  const { hires, completedThisMonth } = useWorkspace();
  const [toast, setToast] = useState<string | null>(null);
  const currentPlan = plans.find((plan) => plan.id === (user?.plan ?? 'growth')) ?? plans[1];
  const tasksIncluded = currentPlan.id === 'launch' ? 500 : currentPlan.id === 'growth' ? 4000 : 100000;
  const tasksUsed = Math.min(completedThisMonth, tasksIncluded);
  const seatsIncluded = currentPlan.id === 'launch' ? 1 : currentPlan.id === 'growth' ? 5 : 999;
  const monthsActive = (() => {
    const start = user?.createdAt ? new Date(user.createdAt) : new Date();
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, months);
  })();
  const history = invoices.slice(0, Math.min(invoices.length, monthsActive));

  const nextInvoice = new Date();
  nextInvoice.setMonth(nextInvoice.getMonth() + 1);
  nextInvoice.setDate(1);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3800);
  };

  const downloadInvoice = (invoice: (typeof invoices)[number]) => {
    downloadFile(
      `${invoice.id}.txt`,
      `NEXORA LABS, INC.\nInvoice ${invoice.id}\nDate: ${invoice.date}\nPlan: ${currentPlan.name}\nAmount: ${currency(invoice.amount)}\nStatus: ${invoice.status}\n\nThank you for building with Nexora.`,
      'text/plain;charset=utf-8',
    );
    showToast(`${invoice.id} downloaded.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Billing"
        description="Your plan, usage, payment method, and invoices."
        actions={
          <ButtonLink to="/pricing" size="sm" variant="secondary" iconRight={<ArrowUpRight className="size-3.5" />}>
            Compare plans
          </ButtonLink>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Current plan" subtitle={`Renews ${nextInvoice.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[22px] font-semibold text-white">{currentPlan.name}</h2>
                <span className="rounded-full border border-[#4d8dff]/30 bg-[#4d8dff]/12 px-2 py-0.5 text-[9.5px] uppercase tracking-wider text-[#9cc0ff]">
                  Active
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#aab8cc]">{currentPlan.description}</p>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-[30px] font-semibold leading-none text-white">
                  ${currentPlan.monthly}
                </span>
                <span className="text-[12px] text-[#aab8cc]">/ month</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => showToast('Plan changes are disabled in this preview.')}>
                Upgrade plan
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-[#a7b4c8] hover:text-rose-300"
                onClick={() => showToast('Cancel flow is disabled in this preview — no charges are real.')}
              >
                Cancel subscription
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-4 border-t border-white/12 pt-4">
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#b9c6d9]">Tasks delivered this cycle</span>
                <span className="font-mono text-[#d8e1ee]">
                  {tasksUsed.toLocaleString()} / {tasksIncluded >= 100000 ? '∞' : tasksIncluded.toLocaleString()}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7aa8ff,#2a5fd6)]"
                  style={{ width: `${Math.min(100, (tasksUsed / tasksIncluded) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#b9c6d9]">Employee seats</span>
                <span className="font-mono text-[#d8e1ee]">
                  {hires.length} / {seatsIncluded >= 999 ? '∞' : seatsIncluded}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#4d8dff,#b8c4d4)]"
                  style={{ width: `${Math.min(100, (hires.length / Math.max(seatsIncluded, 1)) * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-[#8d9bb1]">
              Unused tasks roll over for 30 days. Overage is billed at $0.04 per task, never automatically.
            </p>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Payment method">
            <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[linear-gradient(140deg,#212b3e,#131c2c_60%,#22222c)] p-4">
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-[radial-gradient(circle,rgba(77,141,255,0.16),transparent_70%)] blur-xl" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-[#a8c8ff] to-transparent" />
              <div className="relative flex items-center justify-between">
                <CreditCard className="size-5 text-[#9cc0ff]" />
                <span className="font-display text-[11px] uppercase tracking-[0.16em] text-[#d8e2f0]">Visa</span>
              </div>
              <p className="relative mt-5 font-mono text-[13px] tracking-[0.14em] text-white">•••• •••• •••• 4242</p>
              <div className="relative mt-1.5 flex items-center justify-between text-[9.5px] text-[#a4b0c2]">
                <span>{user?.name ?? 'Cardholder'}</span>
                <span>09 / 29</span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={() => showToast('Payment updates are disabled in this preview.')}
            >
              Update payment method
            </Button>
          </Panel>

          <div className="rounded-[22px] border border-[#4d8dff]/25 bg-[linear-gradient(160deg,rgba(77,141,255,0.14),rgba(77,141,255,0.02))] p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#9cc0ff]" />
              <p className="text-[12px] font-medium text-white">Save with annual billing</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#d8e2f0]">
              Switch to annual and save ${(currentPlan.monthly - currentPlan.annual) * 12} per year on {currentPlan.name}.
            </p>
            <ButtonLink to="/pricing" size="sm" variant="subtle" className="mt-3 w-full" iconRight={<ArrowUpRight className="size-3" />}>
              View annual pricing
            </ButtonLink>
          </div>
        </div>
      </div>

      <Panel title="Invoices" subtitle="Download receipts for your records" padded={false}>
        {history.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#7aa8ff]">
              <ReceiptText className="size-4" />
            </span>
            <p className="mt-3 font-display text-[13.5px] font-semibold text-white">No invoices yet</p>
            <p className="mt-1 max-w-[280px] text-[11.5px] leading-relaxed text-[#aab8cc]">
              You are inside the 14-day trial. Your first receipt appears here once it converts —
              nothing is charged before then.
            </p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-white/10 text-[9.5px] uppercase tracking-[0.1em] text-[#8d9bb1]">
                <th className="px-4 py-2.5 font-medium">Invoice</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Plan</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {history.map((invoice) => (
                <tr key={invoice.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                  <td className="px-4 py-3 font-mono text-[11px] text-white">{invoice.id}</td>
                  <td className="px-3 py-3 text-[11px] text-[#b9c6d9]">{invoice.date}</td>
                  <td className="px-3 py-3 text-[11px] text-[#b9c6d9]">{currentPlan.name} · monthly</td>
                  <td className="px-3 py-3 text-right font-mono text-[11px] text-white">{currency(invoice.amount)}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint/10 px-2 py-0.5 text-[9.5px] text-[#9cc0ff]">
                      <Check className="size-2.5" /> {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => downloadInvoice(invoice)}
                      className="inline-flex items-center gap-1 text-[10.5px] text-[#9cc0ff] transition hover:text-white"
                    >
                      <Download className="size-3" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Panel>

      <Panel title="Available plans" subtitle="Move up or down at any time — prorated automatically">
        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  'rounded-xl border p-4',
                  isCurrent
                    ? 'border-[#4d8dff]/40 bg-[#4d8dff]/[0.07]'
                    : 'border-white/12 bg-white/[0.045] backdrop-blur-xl',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-white">{plan.name}</p>
                  {isCurrent && (
                    <span className="rounded-full bg-[#4d8dff]/20 px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider text-[#9cc0ff]">
                      current
                    </span>
                  )}
                </div>
                <p className="mt-2 font-display text-[20px] font-semibold text-white">
                  ${plan.monthly}
                  <span className="ml-1 text-[10px] font-normal text-[#9aa7bd]">/mo</span>
                </p>
                <p className="mt-1 text-[10px] text-[#a7b4c8]">{plan.employeeLimit}</p>
                <Button
                  variant={isCurrent ? 'ghost' : 'secondary'}
                  size="sm"
                  className="mt-3 w-full"
                  disabled={isCurrent}
                  onClick={() => showToast('Plan changes are disabled in this preview.')}
                >
                  {isCurrent ? 'Current plan' : `Switch to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.045] backdrop-blur-xl px-3 py-2">
          <ReceiptText className="size-3.5 shrink-0 text-[#a7b4c8]" />
          <p className="text-[10px] text-[#9aa7bd]">
            Billing is illustrative in this preview. No payment is collected and no real invoices are issued.
          </p>
        </div>
      </Panel>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
