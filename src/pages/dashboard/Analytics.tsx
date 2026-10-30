import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Clock,
  Download,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { EmptyState, PageHeader, Panel, StatCard, Toast, MiniBar } from '@/components/dashboard/ui';
import { DonutChart, TaskChart } from '@/components/dashboard/TaskChart';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getEmployeeById } from '@/data/employees';
import { csvEscape, downloadFile } from '@/lib/download';
import { activitySeries, changeDirection, changeLabel } from '@/lib/metrics';
import { cn } from '@/lib/utils';

const deptColors: Record<string, string> = {
  Sales: '#2fe3b0',
  Support: '#0bd39a',
  Operations: '#b8c7ca',
  Marketing: '#dbe7e8',
  Finance: '#9df7c2',
  People: '#c7d5d6',
};

export function Analytics() {
  const { hires, hoursSaved, utilization, completedThisMonth, monthlySpend, tasks, activities } =
    useWorkspace();
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [toast, setToast] = useState<string | null>(null);

  const chart = useMemo(
    () => activitySeries(activities, range === '7d' ? 7 : 30, { completionsOnly: true }),
    [activities, range],
  );
  const totalDelivered = hires.reduce((sum, hire) => sum + hire.tasksCompleted, 0);
  // Cost comes from what each hired employee actually bills at, not a hard-coded seat price.
  const costPerTask = totalDelivered > 0 ? monthlySpend / Math.max(completedThisMonth, 1) : 0;

  const segments = useMemo(() => {
    const map = new Map<string, number>();
    hires.forEach((hire) => {
      const person = getEmployeeById(hire.employeeId);
      if (!person) return;
      map.set(person.department, (map.get(person.department) ?? 0) + hire.tasksCompleted);
    });
    return Array.from(map.entries()).map(([label, value]) => ({
      label,
      value,
      color: deptColors[label] ?? '#2fe3b0',
    }));
  }, [hires]);

  const exportReport = () => {
    const header = ['Employee', 'Role', 'Department', 'Status', 'Tasks delivered', 'Hours saved per week', 'Utilisation %', 'Monthly cost'];
    const rows = hires.flatMap((hire) => {
      const person = getEmployeeById(hire.employeeId);
      if (!person) return [];
      return [
        [person.name, person.role, person.department, hire.status, hire.tasksCompleted, person.hoursSavedPerWeek, hire.utilization, person.priceMonthly]
          .map(csvEscape)
          .join(','),
      ];
    });
    downloadFile(
      `nexora-team-report-${new Date().toISOString().slice(0, 10)}.csv`,
      [header.map(csvEscape).join(','), ...rows].join('\n'),
    );
    setToast('Team report exported as CSV.');
    setTimeout(() => setToast(null), 3800);
  };

  const insights = useMemo(() => {
    if (hires.length === 0) return [];
    const ranked = [...hires].sort((a, b) => b.tasksCompleted - a.tasksCompleted);
    const top = getEmployeeById(ranked[0].employeeId);
    const quiet = [...hires].sort((a, b) => a.utilization - b.utilization)[0];
    const quietPerson = getEmployeeById(quiet.employeeId);
    return [
      {
        icon: TrendingUp,
        title: `${top?.name ?? 'Your team'} is your highest-leverage employee`,
        body: `${ranked[0].tasksCompleted.toLocaleString()} tasks delivered at an effective cost of about $${((top?.priceMonthly ?? 0) / Math.max(1, Math.round(ranked[0].tasksCompleted * 0.22))).toFixed(2)} per completed task.`,
      },
      {
        icon: Target,
        title: `${quietPerson?.name ?? 'One employee'} has spare capacity`,
        body: `Utilisation is ${quiet.utilization}%. Consider routing more of the queue there before adding a seat.`,
      },
      {
        icon: Sparkles,
        title: `${completedThisMonth.toLocaleString()} tasks cleared this month`,
        body: `That is roughly ${hoursSaved} hours of work your human team did not have to do.`,
      },
    ];
  }, [hires, completedThisMonth, hoursSaved]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Measure what your AI workforce actually delivers — per employee, department, and dollar."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={exportReport} iconLeft={<Download className="size-3.5" />}>
              Export CSV
            </Button>
            <ButtonLink to="/employees" size="sm">
              Hire employee
            </ButtonLink>
          </>
        }
      />

      {hires.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="size-5" />}
          title="No data to analyse yet"
          description="Hire your first employee and this page fills in as they deliver work — every number here is read from your workspace."
          action={
            <ButtonLink to="/employees" iconRight={<ArrowRight className="size-4" />}>
              Browse employees
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Tasks delivered"
              value={totalDelivered.toLocaleString()}
              delta={changeLabel(chart.changePct) ?? undefined}
              trend={changeDirection(chart.changePct) ?? undefined}
              hint={chart.changePct === null ? 'all time' : 'vs. previous period'}
              tone="mint"
              icon={<TrendingUp className="size-4" />}
              spark={chart.data}
            />
            <StatCard label="Hours returned" value={`${hoursSaved}h`} hint="this month" tone="sky" icon={<Clock className="size-4" />} />
            <StatCard label="Cost per task" value={`$${costPerTask.toFixed(2)}`} hint="this month" tone="amber" icon={<Target className="size-4" />} />
            <StatCard label="Utilisation" value={`${utilization}%`} hint="team average" icon={<Users className="size-4" />} />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
            <Panel
              title="Delivered over time"
              subtitle="Completed tasks across all employees"
              action={
                <div className="flex rounded-lg border border-white/12 bg-white/[0.045] backdrop-blur-xl p-0.5">
                  {(['7d', '30d'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRange(option)}
                      className={cn(
                        'rounded-md px-2 py-1 text-[10.5px] transition',
                        range === option ? 'bg-white/10 text-white' : 'text-[#a7b7be] hover:text-white',
                      )}
                    >
                      {option === '7d' ? '7 days' : '30 days'}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="mb-3 flex items-end gap-3">
                <p className="font-display text-[26px] font-semibold leading-none text-white">
                  {chart.total}
                </p>
                {chart.changePct === null ? (
                  <span className="mb-0.5 text-[10.5px] text-[#9aaab3]">no prior period</span>
                ) : (
                  <>
                    <span
                      className={cn(
                        'mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]',
                        chart.changePct >= 0 ? 'bg-mint/10 text-[#9df7c2]' : 'bg-rose-500/10 text-rose-300',
                      )}
                    >
                      {chart.changePct >= 0 ? (
                        <TrendingUp className="size-2.5" />
                      ) : (
                        <TrendingDown className="size-2.5" />
                      )}
                      {Math.abs(chart.changePct)}%
                    </span>
                    <span className="mb-0.5 text-[10.5px] text-[#9aaab3]">vs. previous period</span>
                  </>
                )}
              </div>
              <TaskChart data={chart.data} labels={chart.labels} height={200} />
            </Panel>

            <Panel title="Output by department" subtitle="Share of delivered tasks">
              <DonutChart segments={segments} centerValue={`${totalDelivered.toLocaleString()}`} centerLabel="tasks" />
            </Panel>
          </div>

          <Panel title="Employee scorecard" subtitle="Performance and cost per hire" padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[9.5px] uppercase tracking-[0.1em] text-[#8d9ea7]">
                    <th className="px-4 py-2.5 font-medium">Employee</th>
                    <th className="px-3 py-2.5 font-medium">Department</th>
                    <th className="px-3 py-2.5 text-right font-medium">Tasks</th>
                    <th className="px-3 py-2.5 text-right font-medium">Hours/wk</th>
                    <th className="px-3 py-2.5 font-medium">Utilisation</th>
                    <th className="px-3 py-2.5 text-right font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {hires.map((hire) => {
                    const person = getEmployeeById(hire.employeeId);
                    if (!person) return null;
                    return (
                      <tr key={hire.employeeId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={person.name}
                              src={person.avatar}
                              initials={person.initials}
                              accent={person.accent}
                              size="sm"
                            />
                            <div>
                              <p className="text-[11.5px] font-medium text-white">{person.name}</p>
                              <p className="text-[9.5px] text-[#9aaab3]">{person.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="rounded-full border border-white/12 bg-white/[0.03] px-2 py-0.5 text-[9.5px] text-[#b9c9cf]">
                            {person.department}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[11px] text-white">
                          {hire.tasksCompleted.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[11px] text-[#b9c9cf]">
                          {person.hoursSavedPerWeek}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-16 overflow-hidden rounded-full bg-white/8">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#2fe3b0,#078a63)]"
                                style={{ width: `${hire.utilization}%` }}
                              />
                            </div>
                            <span className="font-mono text-[9.5px] text-[#9aaab3]">{hire.utilization}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[11px] text-[#b9c9cf]">
                          ${person.priceMonthly}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-3 md:grid-cols-3">
            {insights.map((insight) => (
              <div key={insight.title} className="rounded-[22px] border border-white/12 bg-[linear-gradient(160deg,rgba(11,211,154,0.09),rgba(186,255,228,0.01))] p-4">
                <insight.icon className="size-4 text-[#9df7c2]" />
                <p className="mt-2.5 text-[12px] font-medium leading-snug text-white">{insight.title}</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-[#aabbc2]">{insight.body}</p>
              </div>
            ))}
          </div>

          <Panel title="Queue health" subtitle="Where work currently sits">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                {(['backlog', 'in_progress', 'review', 'done'] as const).map((status) => {
                  const count = tasks.filter((task) => task.status === status).length;
                  const labels = {
                    backlog: 'Backlog',
                    in_progress: 'In progress',
                    review: 'In review',
                    done: 'Done',
                  };
                  return (
                    <MiniBar
                      key={status}
                      label={labels[status]}
                      value={count}
                      max={tasks.length || 1}
                      color={
                        status === 'done'
                          ? '#0bd39a'
                          : status === 'review'
                            ? '#dbe7e8'
                            : status === 'in_progress'
                              ? '#b8c7ca'
                              : '#a7b7be'
                      }
                    />
                  );
                })}
              </div>
              <div className="rounded-xl border border-white/12 bg-white/[0.045] backdrop-blur-xl p-4">
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-[#9aaab3]">Recommendation</p>
                <p className="mt-2 text-[12px] leading-relaxed text-[#cfdcde]">
                  {tasks.filter((task) => task.status === 'review').length > 2
                    ? 'Approval queue is backing up. Clear reviews first — your team is waiting on decisions, not capacity.'
                    : 'Queue is balanced. Route the next high-priority brief to your lowest-utilisation employee to keep delivery times short.'}
                </p>
                <ButtonLink to="/dashboard/tasks" size="sm" variant="secondary" className="mt-3">
                  Open tasks
                </ButtonLink>
              </div>
            </div>
          </Panel>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
