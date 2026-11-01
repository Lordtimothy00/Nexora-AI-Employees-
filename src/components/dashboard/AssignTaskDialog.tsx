import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { getEmployeeById } from '@/data/employees';
import { useWorkspace, type AssignedTask, type Priority } from '@/context/WorkspaceContext';
import { cn } from '@/lib/utils';

const priorities: Priority[] = ['Low', 'Medium', 'High'];

export function AssignTaskDialog({
  open,
  onClose,
  onCreated,
  defaultEmployeeId,
}: {
  open: boolean;
  onClose: () => void;
  /** Fired with the assignment, including the run the employee started on it. */
  onCreated?: (assigned: AssignedTask) => void;
  defaultEmployeeId?: string;
}) {
  const { hires, addTask } = useWorkspace();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId ?? hires[0]?.employeeId ?? '');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmployeeId(defaultEmployeeId ?? hires[0]?.employeeId ?? '');
    setTitle('');
    setDetail('');
    setPriority('Medium');
    setDue('');
    setSaving(false);
  }, [open, defaultEmployeeId, hires]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  /**
   * Assign and let go. The employee starts on the task here — the caller is handed the run so it can
   * report the outcome, but the dialog closes as soon as the task exists rather than waiting on it.
   */
  const submit = async () => {
    if (!title.trim() || !employeeId || saving) return;
    setSaving(true);
    try {
      const assigned = await addTask({
        title: title.trim(),
        employeeId,
        priority,
        detail: detail.trim() || undefined,
        due: due
          ? new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : undefined,
      });
      onCreated?.(assigned);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-task-title"
        className="relative flex max-h-[92dvh] w-full max-w-lg animate-rise flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0a2329]/85 backdrop-blur-2xl shadow-[0_40px_120px_-40px_rgba(0,0,0,1)] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[22px]"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-white/12 px-5 py-4">
          <div>
            <h2 id="assign-task-title" className="font-display text-[15px] font-semibold text-white">
              Assign a task
            </h2>
            <p className="mt-0.5 text-[11.5px] text-[#a7b7be]">
              Describe the outcome. Your employee handles the steps.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 place-items-center rounded-lg text-[#9aaab3] hover:bg-white/8 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {hires.length === 0 ? (
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-6 text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
              <Sparkles className="size-5 text-[#2fe3b0]" />
            </div>
            <h3 className="mt-4 font-display text-[15px] font-semibold text-white">No employees yet</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-[#aabbc2]">
              Hire your first AI employee to start delegating work. It takes about four minutes.
            </p>
            <ButtonLink to="/employees" className="mt-5" size="sm">
              Browse employees
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="scroll-thin min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label htmlFor="task-title" className="text-[11.5px] font-medium text-[#c4d3d8]">
                  What needs to get done?
                </label>
                <input
                  id="task-title"
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Build a 40-account prospect list for fintech ops leaders"
                  className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[12.5px] text-white placeholder:text-[#8d9ea7] focus:border-[#0bd39a]/60 focus:outline-none focus:ring-4 focus:ring-[#0bd39a]/10"
                />
              </div>

              <div>
                <p className="text-[11.5px] font-medium text-[#c4d3d8]">Assign to</p>
                <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                  {hires.map((hire) => {
                    const person = getEmployeeById(hire.employeeId);
                    if (!person) return null;
                    const active = employeeId === hire.employeeId;
                    return (
                      <button
                        key={hire.employeeId}
                        type="button"
                        onClick={() => setEmployeeId(hire.employeeId)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition',
                          active
                            ? 'border-[#0bd39a]/50 bg-[#0bd39a]/10'
                            : 'border-white/12 bg-white/[0.045] backdrop-blur-xl hover:border-white/16',
                        )}
                      >
                        <Avatar
                          name={person.name}
                          src={person.avatar}
                          initials={person.initials}
                          accent={person.accent}
                          size="xs"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-medium text-white">{person.name}</span>
                          <span className="block truncate text-[9.5px] text-[#9aaab3]">{person.role}</span>
                        </span>
                        {active && <span className="size-1.5 rounded-full bg-[#2fe3b0]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11.5px] font-medium text-[#c4d3d8]">Priority</p>
                  <div className="mt-1.5 flex rounded-lg border border-white/10 bg-white/[0.045] backdrop-blur-xl p-0.5">
                    {priorities.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPriority(level)}
                        className={cn(
                          'flex-1 rounded-md py-1.5 text-[11px] transition',
                          priority === level ? 'bg-white/10 text-white' : 'text-[#a7b7be] hover:text-white',
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="task-due" className="text-[11.5px] font-medium text-[#c4d3d8]">
                    Due date
                  </label>
                  <input
                    id="task-due"
                    type="date"
                    value={due}
                    onChange={(event) => setDue(event.target.value)}
                    className="mt-1.5 h-[34px] w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-[11.5px] text-[#d8e4e4] focus:border-[#0bd39a]/60 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="task-detail" className="text-[11.5px] font-medium text-[#c4d3d8]">
                  Context <span className="font-normal text-[#8d9ea7]">(optional)</span>
                </label>
                <textarea
                  id="task-detail"
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  rows={3}
                  placeholder="Tone, constraints, examples, or the definition of done…"
                  className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] leading-relaxed text-white placeholder:text-[#8d9ea7] focus:border-[#0bd39a]/60 focus:outline-none focus:ring-4 focus:ring-[#0bd39a]/10"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/12 bg-white/[0.015] px-5 py-3.5">
              <p className="text-[10.5px] text-[#8d9ea7]">
                Starts the moment you assign it — no second click. You review the work when it lands.
              </p>
              <Button
                size="sm"
                onClick={() => void submit()}
                loading={saving}
                disabled={!title.trim() || saving}
                iconRight={<ArrowRight className="size-3.5" />}
              >
                Assign &amp; start
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
