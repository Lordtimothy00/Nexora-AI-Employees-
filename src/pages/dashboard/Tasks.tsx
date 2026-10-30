import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Eye,
  Inbox,
  ListChecks,
  Plus,
  X,
} from 'lucide-react';
import { EmptyState, PageHeader, Toast } from '@/components/dashboard/ui';
import { AssignTaskDialog } from '@/components/dashboard/AssignTaskDialog';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useWorkspace, type Task, type TaskStatus } from '@/context/WorkspaceContext';
import { getEmployeeById } from '@/data/employees';
import { cn } from '@/lib/utils';

const columns: {
  id: TaskStatus;
  label: string;
  icon: typeof Inbox;
  accent: string;
  dot: string;
}[] = [
  { id: 'backlog', label: 'Backlog', icon: Inbox, accent: 'text-[#b2b3af]', dot: 'bg-[#9d9e9a]' },
  { id: 'in_progress', label: 'In progress', icon: CircleDot, accent: 'text-[#dadbd7]', dot: 'bg-[#b9bcb4]' },
  { id: 'review', label: 'In review', icon: Eye, accent: 'text-[#e6e7e3]', dot: 'bg-[#d3d5cd]' },
  { id: 'done', label: 'Done', icon: CheckCircle2, accent: 'text-[#e2fa9e]', dot: 'bg-mint' },
];

const priorityStyles: Record<Task['priority'], string> = {
  High: 'bg-rose-400/10 text-[#d7d8d4] ring-rose-400/20',
  Medium: 'bg-amber/10 text-[#e6e7e3] ring-amber/20',
  Low: 'bg-white/[0.04] text-[#b2b3af] ring-white/10',
};

const order: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done'];

export function Tasks() {
  const { tasks, hires, moveTask } = useWorkspace();
  const [filter, setFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((task) => task.employeeId === filter)),
    [tasks, filter],
  );

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3800);
  };

  const advance = (task: Task, direction: 1 | -1) => {
    const index = order.indexOf(task.status);
    const next = order[Math.min(order.length - 1, Math.max(0, index + direction))];
    if (next === task.status) return;
    moveTask(task.id, next);
    showToast(`“${task.title}” moved to ${columns.find((column) => column.id === next)?.label}.`);
    setSelected((current) => (current ? { ...current, status: next } : current));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Work queue"
        title="Tasks"
        description="Everything delegated to your team, from first brief to delivered output."
        actions={
          <>
            <ButtonLink to="/employees" variant="secondary" size="sm" iconLeft={<Plus className="size-3.5" />}>
              Hire
            </ButtonLink>
            <Button size="sm" onClick={() => setDialogOpen(true)} iconLeft={<Plus className="size-3.5" />}>
              Assign task
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scroll-thin flex max-w-full items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] transition',
              filter === 'all'
                ? 'border-[#c8f060]/40 bg-[#c8f060]/12 text-white'
                : 'border-white/8 bg-white/[0.02] text-[#a0a19d] hover:text-white',
            )}
          >
            All team · {tasks.length}
          </button>
          {hires.map((hire) => {
            const person = getEmployeeById(hire.employeeId);
            if (!person) return null;
            const count = tasks.filter((task) => task.employeeId === hire.employeeId).length;
            return (
              <button
                key={hire.employeeId}
                type="button"
                onClick={() => setFilter(hire.employeeId)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11.5px] transition',
                  filter === hire.employeeId
                    ? 'border-[#c8f060]/40 bg-[#c8f060]/12 text-white'
                    : 'border-white/8 bg-white/[0.02] text-[#a0a19d] hover:text-white',
                )}
              >
                <Avatar
                  name={person.name}
                  src={person.avatar}
                  initials={person.initials}
                  accent={person.accent}
                  size="xs"
                  className="size-4 rounded-full text-[8px]"
                />
                {person.name}
                <span className="font-mono text-[9px] text-[#8e8f8b]">{count}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#7c7d79]">
          {filtered.filter((task) => task.status === 'review').length} awaiting your approval
        </p>
      </div>

      {hires.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title="No one to delegate to yet"
          description="Hire an AI employee first, then assign the work. Tasks are tracked from brief to delivery."
          action={<ButtonLink to="/employees">Browse employees</ButtonLink>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => {
            const columnTasks = filtered.filter((task) => task.status === column.id);
            return (
              <div
                key={column.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!dragging) return;
                  moveTask(dragging, column.id);
                  setDragging(null);
                }}
                className="flex min-h-[220px] flex-col rounded-2xl border border-white/8 bg-[#0b0c0d]"
              >
                <div className="flex items-center justify-between border-b border-white/6 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('size-1.5 rounded-full', column.dot)} />
                    <p className="text-[11.5px] font-medium text-white">{column.label}</p>
                    <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-[#a0a19d]">
                      {columnTasks.length}
                    </span>
                  </div>
                  <column.icon className={cn('size-3.5', column.accent)} />
                </div>

                <div className="flex-1 space-y-2 p-2.5">
                  {columnTasks.map((task) => {
                    const person = getEmployeeById(task.employeeId);
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDragging(task.id)}
                        onDragEnd={() => setDragging(null)}
                        className={cn(
                          'group cursor-grab rounded-xl border border-white/8 bg-[#131415] p-3 transition-all hover:border-white/16 hover:bg-[#18191b] active:cursor-grabbing',
                          dragging === task.id && 'opacity-50',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelected(task)}
                            className="flex-1 text-left"
                          >
                            <p className="text-[11.5px] font-medium leading-snug text-white">{task.title}</p>
                            <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#9d9e9a]">
                              {task.detail}
                            </p>
                          </button>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {person && (
                              <Avatar
                                name={person.name}
                                src={person.avatar}
                                initials={person.initials}
                                accent={person.accent}
                                size="xs"
                                className="size-5 rounded-full text-[7px]"
                              />
                            )}
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[8.5px] ring-1 ring-inset',
                                priorityStyles[task.priority],
                              )}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <span className="font-mono text-[8.5px] text-[#7c7d79]">{task.due}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-1.5">
                          <span className="text-[8.5px] text-[#5e5f5c]">{person?.name ?? 'Unassigned'}</span>
                          <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => advance(task, -1)}
                              disabled={task.status === 'backlog'}
                              aria-label="Move back"
                              className="grid size-5 place-items-center rounded text-[#9d9e9a] hover:bg-white/8 hover:text-white disabled:opacity-30"
                            >
                              <ArrowLeft className="size-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => advance(task, 1)}
                              disabled={task.status === 'done'}
                              aria-label="Move forward"
                              className="grid size-5 place-items-center rounded text-[#9d9e9a] hover:bg-white/8 hover:text-white disabled:opacity-30"
                            >
                              <ArrowRight className="size-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="flex h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-white/8 text-center">
                      <p className="text-[10px] text-[#5e5f5c]">Nothing here</p>
                      <p className="mt-0.5 text-[9px] text-[#33363a]">Drag a task in</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-white/8 bg-white/[0.015] px-4 py-3 text-[10.5px] text-[#8e8f8b]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#b9bcb4]" /> Drag cards between columns
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ChevronRight className="size-3" /> Or use the arrows on hover
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-3" /> Anything in review needs your approval
        </span>
      </div>

      <AssignTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultEmployeeId={filter === 'all' ? undefined : filter}
        onCreated={(title) => showToast(`“${title}” added to the backlog.`)}
      />

      {/* task detail */}
      {selected && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg animate-rise overflow-hidden rounded-t-2xl border border-white/10 bg-[#111213] sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8e8f8b]">Task brief</p>
                <h2 className="mt-1 font-display text-[15px] font-semibold leading-snug text-white">
                  {selected.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="grid size-7 place-items-center rounded-lg text-[#8e8f8b] hover:bg-white/8 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] ring-1 ring-inset',
                    priorityStyles[selected.priority],
                  )}
                >
                  {selected.priority} priority
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-[#b2b3af]">
                  Due {selected.due}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-[#b2b3af]">
                  <span className="size-1.5 rounded-full bg-mint" />
                  {columns.find((column) => column.id === selected.status)?.label}
                </span>
              </div>

              {(() => {
                const person = getEmployeeById(selected.employeeId);
                if (!person) return null;
                return (
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] p-2.5">
                    <Avatar
                      name={person.name}
                      src={person.avatar}
                      initials={person.initials}
                      accent={person.accent}
                      size="sm"
                      status="online"
                    />
                    <div>
                      <p className="text-[12px] font-medium text-white">{person.name}</p>
                      <p className="text-[10.5px] text-[#8e8f8b]">{person.role}</p>
                    </div>
                  </div>
                );
              })()}

              <div>
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-[#8e8f8b]">Context</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#c3c4c0]">{selected.detail}</p>
              </div>

              <div>
                <p className="text-[10.5px] uppercase tracking-[0.1em] text-[#8e8f8b]">Move to</p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {columns.map((column) => (
                    <button
                      key={column.id}
                      type="button"
                      onClick={() => {
                        if (column.id === selected.status) return;
                        moveTask(selected.id, column.id);
                        setSelected({ ...selected, status: column.id });
                        showToast(`“${selected.title}” moved to ${column.label}.`);
                      }}
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5 text-[11px] transition',
                        selected.status === column.id
                          ? 'border-[#c8f060]/40 bg-[#c8f060]/12 text-white'
                          : 'border-white/8 bg-white/[0.02] text-[#a0a19d] hover:border-white/16 hover:text-white',
                      )}
                    >
                      {column.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/8 bg-white/[0.015] px-5 py-3">
              <p className="text-[10px] text-[#7c7d79]">Auto-saved to your workspace</p>
              <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
