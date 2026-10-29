import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { PageHeader, Panel, StatCard, Toast, EmptyState } from '@/components/dashboard/ui';
import { TaskChart } from '@/components/dashboard/TaskChart';
import { AssignTaskDialog } from '@/components/dashboard/AssignTaskDialog';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getEmployeeById } from '@/data/employees';
import { cn, greeting } from '@/lib/utils';

const rangeData = {
  '7d': {
    data: [26, 38, 34, 52, 47, 63, 78],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  '30d': {
    data: [18, 26, 22, 34, 30, 44, 39, 52, 47, 58, 54, 68, 62, 74],
    labels: ['1 Oct', '5', '9', '13', '17', '21', '25', '29'],
  },
};

export function Overview() {
  const { user } = useAuth();
  const {
    hires,
    tasks,
    activities,
    hoursSaved,
    completedThisMonth,
    utilization,
    moveTask,
  } = useWorkspace();
  const [range, setRange] = useState<keyof typeof rangeData>('7d');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeHires = hires.filter((hire) => hire.status === 'active');
  const approvals = tasks.filter((task) => task.status === 'review');
  const chart = rangeData[range];
  const firstName = user?.name.split(' ')[0] ?? 'there';

  const approve = (taskId: string, title: string) => {
    moveTask(taskId, 'done');
    setToast(`Approved “${title}”. Your employee has been notified.`);
    setTimeout(() => setToast(null), 4200);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`${greeting()}, ${firstName}`}
        description={
          hires.length > 0
            ? `Your team shipped ${completedThisMonth.toLocaleString()} tasks this month and saved roughly ${hoursSaved} hours.`
            : 'Your workspace is ready. Hire your first AI employee to start clearing the backlog.'
        }
        actions={
          <>
            <ButtonLink to="/employees" variant="secondary" size="sm" iconLeft={<Plus className="size-3.5" />}>
              Hire employee
            </ButtonLink>
            <Button size="sm" onClick={() => setDialogOpen(true)} iconLeft={<Zap className="size-3.5" />}>
              Assign task
            </Button>
          </>
        }
      />

      {hires.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Your first employee is waiting"
          description="Pick a specialist from the roster, connect their tools, and assign your first real task. Most teams see output within the hour."
          action={
            <ButtonLink to="/employees" iconRight={<ArrowRight className="size-4" />}>
              Browse the roster
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Active employees"
              value={`${activeHires.length}`}
              delta={activeHires.length === hires.length ? 'All online' : '1 paused'}
              hint="of 5 seats"
              icon={<Users className="size-4" />}
              spark={[2, 2, 2, 3, 3, 3, hires.length || 3]}
            />
            <StatCard
              label="Tasks this month"
              value={completedThisMonth.toLocaleString()}
              delta="+18%"
              hint="vs. last month"
              tone="mint"
              icon={<CheckCircle2 className="size-4" />}
              spark={[22, 30, 26, 38, 44, 40, 52]}
            />
            <StatCard
              label="Hours saved"
              value={`${hoursSaved}h`}
              delta="+12h"
              hint="this month"
              tone="sky"
              icon={<Clock className="size-4" />}
              spark={[18, 24, 30, 28, 36, 42, 48]}
            />
            <StatCard
              label="Utilisation"
              value={`${utilization}%`}
              delta="Healthy"
              hint="team average"
              tone="amber"
              icon={<Sparkles className="size-4" />}
              spark={[54, 58, 62, 60, 68, 72, utilization || 70]}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
            <Panel
              title="Work delivered"
              subtitle="Completed tasks per day, across your team"
              action={
                <div className="flex rounded-lg border border-white/8 bg-white/[0.02] p-0.5">
                  {(['7d', '30d'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRange(option)}
                      className={cn(
                        'rounded-md px-2 py-1 text-[10.5px] transition',
                        range === option ? 'bg-white/10 text-white' : 'text-[#7c8095] hover:text-white',
                      )}
                    >
                      {option === '7d' ? '7 days' : '30 days'}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="font-display text-[26px] font-semibold leading-none text-white">
                    {chart.data.reduce((sum, value) => sum + value, 0)}
                  </p>
                  <p className="mt-1 text-[11px] text-[#6c7085]">tasks completed · last {range === '7d' ? '7' : '30'} days</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-mint/10 px-2 py-1 text-[10.5px] text-[#8bf0d8]">
                  <ArrowUpRight className="size-3" /> 18.4%
                </span>
              </div>
              <TaskChart data={chart.data} labels={chart.labels} height={168} />
            </Panel>

            <Panel title="Live activity" subtitle="What your team shipped" padded={false}>
              <div className="max-h-[317px] overflow-y-auto">
                {activities.slice(0, 7).map((activity) => {
                  const person = getEmployeeById(activity.employeeId);
                  return (
                    <div key={activity.id} className="flex gap-2.5 border-b border-white/5 px-4 py-2.5 last:border-0">
                      <Avatar
                        name={person?.name ?? 'Nexora'}
                        src={person?.avatar}
                        initials={person?.initials ?? 'NX'}
                        accent={person?.accent ?? 'violet'}
                        size="xs"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] leading-relaxed text-[#c3c6d4]">{activity.text}</p>
                        <p className="mt-0.5 text-[9.5px] text-[#5f6376]">
                          {person?.name} · {timeAgo(activity.at)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'mt-1 size-1.5 shrink-0 rounded-full',
                          activity.kind === 'alert' ? 'bg-amber' : activity.kind === 'hire' ? 'bg-[#a78bfa]' : 'bg-mint',
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
            <Panel
              title="Your team"
              subtitle={`${activeHires.length} active · ${hires.length} hired`}
              action={
                <Link to="/dashboard/team" className="text-[11.5px] text-[#c4b5fd] hover:text-white">
                  Manage
                </Link>
              }
              padded={false}
            >
              <div className="divide-y divide-white/5">
                {hires.map((hire) => {
                  const person = getEmployeeById(hire.employeeId);
                  if (!person) return null;
                  return (
                    <div key={hire.employeeId} className="flex items-center gap-3 px-4 py-3">
                      <Avatar
                        name={person.name}
                        src={person.avatar}
                        initials={person.initials}
                        accent={person.accent}
                        size="md"
                        status={hire.status === 'active' ? 'online' : 'paused'}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[12.5px] font-medium text-white">{person.name}</p>
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider ring-1 ring-inset',
                              hire.status === 'active'
                                ? 'bg-mint/10 text-[#8bf0d8] ring-mint/20'
                                : 'bg-amber/10 text-[#ffd9a8] ring-amber/20',
                            )}
                          >
                            {hire.status}
                          </span>
                        </div>
                        <p className="truncate text-[10.5px] text-[#6c7085]">{person.role}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1 w-24 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#a78bfa,#5d7cff)]"
                              style={{ width: `${hire.utilization}%` }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-[#6c7085]">{hire.utilization}%</span>
                        </div>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-[12px] font-medium text-white">{hire.tasksCompleted.toLocaleString()}</p>
                        <p className="text-[9.5px] text-[#6c7085]">tasks</p>
                      </div>
                      <Link
                        to="/dashboard/conversations"
                        className="grid size-8 place-items-center rounded-lg border border-white/8 bg-white/[0.03] text-[#a3a7b8] transition hover:border-white/20 hover:text-white"
                        aria-label={`Message ${person.name}`}
                      >
                        <MessageSquare className="size-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title="Needs your approval"
              subtitle={approvals.length > 0 ? `${approvals.length} decisions waiting` : 'Nothing blocked'}
              padded={false}
            >
              {approvals.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-10 text-center">
                  <span className="grid size-10 place-items-center rounded-full bg-mint/10 ring-1 ring-inset ring-mint/20">
                    <Check className="size-4 text-mint" />
                  </span>
                  <p className="mt-3 text-[12.5px] font-medium text-white">Queue is clear</p>
                  <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed text-[#6c7085]">
                    Your team is operating inside policy. Anything new will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {approvals.slice(0, 4).map((task) => {
                    const person = getEmployeeById(task.employeeId);
                    return (
                      <div key={task.id} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Avatar
                            name={person?.name ?? 'Nexora'}
                            src={person?.avatar}
                            initials={person?.initials ?? 'NX'}
                            accent={person?.accent ?? 'violet'}
                            size="xs"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11.5px] font-medium leading-snug text-white">{task.title}</p>
                            <p className="mt-0.5 text-[9.5px] text-[#6c7085]">
                              {person?.name} · due {task.due}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 pl-9">
                          <Button size="sm" className="h-7 px-3 text-[10.5px]" onClick={() => approve(task.id, task.title)}>
                            Approve
                          </Button>
                          <Link
                            to="/dashboard/tasks"
                            className="rounded-full border border-white/10 px-3 py-1 text-[10.5px] text-[#a3a7b8] transition hover:border-white/20 hover:text-white"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>

          <Panel className="relative overflow-hidden" padded={false}>
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.25]" />
            <div className="relative flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {hires.slice(0, 3).map((hire) => {
                    const person = getEmployeeById(hire.employeeId);
                    if (!person) return null;
                    return (
                      <Avatar
                        key={hire.employeeId}
                        name={person.name}
                        src={person.avatar}
                        initials={person.initials}
                        accent={person.accent}
                        size="sm"
                        className="ring-2 ring-[#0a0c12]"
                      />
                    );
                  })}
                </div>
                <div>
                  <p className="text-[12.5px] font-medium text-white">Give your team more leverage</p>
                  <p className="text-[11px] text-[#6c7085]">
                    You have {5 - hires.length} seats left on the Growth plan.
                  </p>
                </div>
              </div>
              <ButtonLink to="/employees" size="sm" variant="secondary" iconRight={<ArrowRight className="size-3.5" />}>
                Hire another employee
              </ButtonLink>
            </div>
          </Panel>
        </>
      )}

      <AssignTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(title) => {
          setToast(`“${title}” assigned. Your employee will confirm scope shortly.`);
          setTimeout(() => setToast(null), 4200);
        }}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
