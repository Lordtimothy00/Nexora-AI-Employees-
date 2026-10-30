import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { EmptyState, PageHeader, Panel, StatCard, Toast } from '@/components/dashboard/ui';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getEmployeeById } from '@/data/employees';
import { cn } from '@/lib/utils';

export function Team() {
  const { hires, togglePause, release, utilization, hoursSaved } = useWorkspace();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(() => null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const active = hires.filter((hire) => hire.status === 'active').length;
  const totalTasks = hires.reduce((sum, hire) => sum + hire.tasksCompleted, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title="My team"
        description="Every AI employee in your workspace, with utilisation, output, and controls."
        actions={
          <ButtonLink to="/employees" size="sm" iconLeft={<Plus className="size-3.5" />}>
            Hire employee
          </ButtonLink>
        }
      />

      {hires.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="No employees hired yet"
          description="Your workspace is empty. Browse the roster and hire a specialist for the work that keeps slipping."
          action={
            <ButtonLink to="/employees" iconRight={<ArrowRight className="size-4" />}>
              Browse employees
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Team size" value={`${hires.length}`} hint="of 5 seats" icon={<Users className="size-4" />} />
            <StatCard label="Active now" value={`${active}`} hint="online" tone="mint" icon={<Sparkles className="size-4" />} />
            <StatCard label="Tasks delivered" value={totalTasks.toLocaleString()} hint="lifetime" tone="sky" icon={<Clock className="size-4" />} />
            <StatCard label="Avg utilisation" value={`${utilization}%`} hint="this week" tone="amber" delta="Healthy" />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {hires.map((hire) => {
              const person = getEmployeeById(hire.employeeId);
              if (!person) return null;
              const isPaused = hire.status === 'paused';
              return (
                <div
                  key={hire.employeeId}
                  className={cn(
                    'relative overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(160deg,rgba(226,236,247,0.04),rgba(226,236,247,0.01))] transition-colors hover:border-white/16',
                    isPaused && 'opacity-80',
                  )}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={person.name}
                        src={person.avatar}
                        initials={person.initials}
                        accent={person.accent}
                        size="lg"
                        status={isPaused ? 'paused' : 'online'}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-display text-[15px] font-semibold text-white">{person.name}</h2>
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider ring-1 ring-inset',
                              isPaused
                                ? 'bg-amber/10 text-[#e4e7e9] ring-amber/20'
                                : 'bg-mint/10 text-[#e2fa9e] ring-mint/20',
                            )}
                          >
                            {hire.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#acb3bc]">{person.role}</p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a919a]">
                          {person.department}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/employees/${person.slug}`}
                      aria-label={`View ${person.name}'s profile`}
                      className="grid size-7 place-items-center rounded-lg text-[#8a919a] transition hover:bg-white/8 hover:text-white"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-white/6 border-b border-white/10">
                    {[
                      { label: 'Tasks', value: hire.tasksCompleted.toLocaleString() },
                      { label: 'Hours/wk', value: `${person.hoursSavedPerWeek}` },
                      { label: 'Util.', value: `${hire.utilization}%` },
                    ].map((stat) => (
                      <div key={stat.label} className="px-3 py-2.5 text-center">
                        <p className="font-display text-[14px] font-semibold text-white">{stat.value}</p>
                        <p className="text-[9px] uppercase tracking-[0.08em] text-[#8a919a]">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-[10px] text-[#9ba2ab]">
                      <span>Utilisation this week</span>
                      <span>{hire.utilization}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          isPaused
                            ? 'bg-amber/60'
                            : 'bg-[linear-gradient(90deg,#d7f68c,#8fae2f)]',
                        )}
                        style={{ width: `${hire.utilization}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      <Link
                        to="/dashboard/conversations"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 text-[11px] text-[#cccfd1] transition hover:border-white/20 hover:text-white"
                      >
                        <MessageSquare className="size-3" /> Message
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          togglePause(person.id);
                          showToast(
                            isPaused
                              ? `${person.name} is back online and picking up the queue.`
                              : `${person.name} is paused. Queued work will hold until resumed.`,
                          );
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-[#cccfd1] transition hover:border-white/20 hover:text-white"
                      >
                        {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                    </div>

                    {confirming === person.id ? (
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-rose-400/25 bg-rose-500/[0.06] px-2.5 py-1.5">
                        <p className="text-[10px] text-rose-200">Remove {person.name}?</p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              release(person.id);
                              setConfirming(null);
                              showToast(`${person.name} removed from your workspace.`);
                            }}
                            className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-100 hover:bg-rose-500/30"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="rounded-md px-2 py-0.5 text-[10px] text-[#bbc2cb] hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(person.id)}
                        className="mt-2 w-full text-center text-[9.5px] text-[#5c5f62] transition hover:text-rose-300"
                      >
                        Remove from team
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <Link
              to="/employees"
              className="group flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.015] p-6 text-center transition-colors hover:border-[#c8f060]/40 hover:bg-[#c8f060]/[0.04]"
            >
              <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#d7f68c] transition group-hover:border-[#c8f060]/40">
                <Plus className="size-4" />
              </span>
              <p className="mt-3 text-[12.5px] font-medium text-white">Add another employee</p>
              <p className="mt-1 max-w-[180px] text-[10.5px] leading-relaxed text-[#9ba2ab]">
                {5 - hires.length} seats remaining on Growth
              </p>
            </Link>
          </div>

          <Panel title="Team economics" subtitle="What this team would cost as headcount">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Human equivalent', value: `$${(hires.length * 6200).toLocaleString()}/mo`, hint: 'avg. loaded salary' },
                { label: 'Your Nexora cost', value: `$${hires.length * 49}/mo`, hint: 'billed monthly' },
                { label: 'Monthly saving', value: `$${(hires.length * 6151).toLocaleString()}`, hint: `${hoursSaved}h of work returned` },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-white/12 bg-white/[0.045] backdrop-blur-xl p-3.5">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[#9ba2ab]">{row.label}</p>
                  <p className="mt-1 font-display text-[17px] font-semibold text-white">{row.value}</p>
                  <p className="mt-0.5 text-[10px] text-[#8a919a]">{row.hint}</p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
