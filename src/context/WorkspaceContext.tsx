import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { employees, getEmployeeById } from '@/data/employees';
import { runTask, scriptedDeliverable, type TaskRunResult } from '@/lib/tasks';
import { useAuth } from '@/context/AuthContext';
import {
  createHire as createRemoteHire,
  createWorkspace as createRemoteWorkspace,
  createMessage as createRemoteMessage,
  deleteWorkspace as deleteRemoteWorkspace,
  createTask as createRemoteTask,
  deleteHire as deleteRemoteHire,
  ensureWorkspace,
  fetchWorkspace,
  fetchWorkspaceBilling,
  fetchWorkspaces,
  getWorkspaceId,
  leaveWorkspace as leaveRemoteWorkspace,
  renameWorkspace as renameRemoteWorkspace,
  setHireStatus,
  setTaskStatus,
  switchWorkspace as switchRemoteWorkspace,
  type WorkspaceBilling,
  type WorkspaceSummary,
} from '@/lib/backend';
import { backendConfigured } from '@/lib/supabase';

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';
export type Priority = 'Low' | 'Medium' | 'High';

export interface Hire {
  employeeId: string;
  hiredAt: string;
  status: 'active' | 'paused';
  tasksCompleted: number;
  utilization: number;
}

export interface Task {
  id: string;
  title: string;
  employeeId: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  detail: string;
}

export interface AssignTaskInput {
  title: string;
  employeeId: string;
  priority: Priority;
  due?: string;
  detail?: string;
}

export interface AssignedTask {
  task: Task;
  /**
   * The run that started with the assignment. Awaited by the caller for its toast, never by the
   * dialog — closing the sheet should not wait on a model call. Null when nobody may work yet.
   */
  start: Promise<TaskRunResult> | null;
  /** Why `start` is null, so the UI can say something specific instead of nothing. */
  blocked?: 'locked' | 'paused' | 'not_saved';
}

export interface Deliverable {
  text: string;
  provider: string | null;
}

export interface ChatMessage {
  id: string;
  employeeId: string;
  from: 'human' | 'employee';
  text: string;
  at: string;
}

export interface Activity {
  id: string;
  employeeId: string;
  text: string;
  at: string;
  kind: 'delivery' | 'hire' | 'alert' | 'approval';
}

interface WorkspaceState {
  hires: Hire[];
  tasks: Task[];
  messages: ChatMessage[];
  activities: Activity[];
}

interface WorkspaceContextValue extends WorkspaceState {
  hire: (employeeId: string) => void;
  release: (employeeId: string) => void;
  togglePause: (employeeId: string) => void;
  /**
   * Adds a task and immediately starts the employee on it — the point of delegating is that nobody
   * has to press Run afterwards. Resolves once the task exists, not once the work is done.
   */
  addTask: (input: AssignTaskInput) => Promise<AssignedTask>;
  /** Runs one task. Used by the Run button, and by `addTask` for the automatic first pass. */
  startTask: (task: Task) => Promise<TaskRunResult>;
  /** Tasks with a run in flight, for spinners and disabled buttons. */
  runningTaskIds: string[];
  /** The deliverable produced for a task in this session, or null if none has landed. */
  deliverableFor: (taskId: string) => Deliverable | null;
  moveTask: (taskId: string, status: TaskStatus) => void;
  appendMessage: (employeeId: string, text: string, from?: 'human' | 'employee') => void;
  completedThisMonth: number;
  hoursSaved: number;
  utilization: number;
  /** What the current team costs per month, read from each employee's price. */
  monthlySpend: number;
  /** Workspaces this person can move between. Empty in the local demo. */
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  switching: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  /** Renames the workspace the person is currently in. Owner/admin only, enforced on the server. */
  renameActiveWorkspace: (name: string) => Promise<void>;
  /** Deletes the active workspace and everything in it, moving the person to their oldest remaining one. */
  deleteActiveWorkspace: () => Promise<void>;
  /** Leaves the active workspace. Ownership passes on if the caller owned it. */
  leaveActiveWorkspace: () => Promise<void>;
  /** Stripe's own view of the active workspace. Null in the local demo. */
  billing: WorkspaceBilling | null;
  /**
   * True when the subscription is no longer paying, so the AI employees are paused. Set from
   * `workspace_billing()`, which derives it server-side; the browser never decides this itself.
   */
  aiLocked: boolean;
  /** `past_due`, `unpaid`, `canceled`, … Null before any subscription exists. */
  billingStatus: string | null;
  /** Re-reads billing alone. Used after returning from the Stripe portal. */
  refreshBilling: () => Promise<void>;
  /**
   * Re-reads the workspace from Postgres. Used after something server-side changed rows the
   * browser did not write itself — running a task writes a message, an activity and a status.
   */
  refreshWorkspace: () => Promise<void>;
}

const STORAGE_KEY = 'nexora.workspace.v2';
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const now = new Date();
const iso = (daysAgo: number, hoursAgo = 0) =>
  new Date(now.getTime() - daysAgo * 86_400_000 - hoursAgo * 3_600_000).toISOString();
const dueIn = (days: number) =>
  new Date(now.getTime() + days * 86_400_000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

/**
 * Context for a task assigned without a brief. The employee starts from the title alone — saying
 * they will "confirm scope before starting" was the opposite of what now happens.
 */
export const NO_BRIEF_DETAIL = 'No brief attached — your employee is working from the title alone.';

const historySeed: Activity[] = (() => {
  const lines: { employeeId: string; text: string; kind: Activity['kind'] }[] = [
    { employeeId: 'emp_kai', text: 'Cleared the overnight support queue', kind: 'delivery' },
    { employeeId: 'emp_ava', text: 'Qualified 6 inbound accounts from the pricing page', kind: 'approval' },
    { employeeId: 'emp_atlas', text: 'Refreshed the weekly retention cohort', kind: 'delivery' },
    { employeeId: 'emp_kai', text: 'Escalated 2 refund requests above policy', kind: 'alert' },
    { employeeId: 'emp_ava', text: 'Shipped follow-up sequence v3 to 240 contacts', kind: 'delivery' },
    { employeeId: 'emp_atlas', text: 'Reconciled usage data against billing', kind: 'delivery' },
    { employeeId: 'emp_kai', text: 'Rewrote 9 macros from resolved tickets', kind: 'approval' },
  ];

  const out: Activity[] = [];
  let index = 0;

  for (let day = 30; day >= 1; day -= 1) {
    if (day % 6 === 0) continue; // quiet days keep the trend honest
    const perDay = day % 4 === 0 ? 1 : 2;

    for (let slot = 0; slot < perDay; slot += 1) {
      const line = lines[index % lines.length];
      out.push({
        id: `act_h${index}`,
        employeeId: line.employeeId,
        text: line.text,
        at: iso(day, 2 + slot * 4),
        kind: line.kind,
      });
      index += 1;
    }
  }

  return out;
})();

const seedActivityList: Activity[] = [
  { id: 'act_01', employeeId: 'emp_kai', text: 'Resolved 112 tickets in the northeast carrier delay batch', at: iso(0, 2), kind: 'delivery' },
  { id: 'act_02', employeeId: 'emp_ava', text: 'Booked 3 qualified meetings from the fintech sequence', at: iso(0, 4), kind: 'approval' },
  { id: 'act_03', employeeId: 'emp_atlas', text: 'Published the October revenue churn readout', at: iso(1, 1), kind: 'delivery' },
  { id: 'act_04', employeeId: 'emp_atlas', text: 'Flagged an activation drop isolated to iOS web checkout', at: iso(1, 6), kind: 'alert' },
  { id: 'act_05', employeeId: 'emp_ava', text: 'Sequence v1 crossed a 9.4% reply rate', at: iso(2, 3), kind: 'delivery' },
  { id: 'act_06', employeeId: 'emp_atlas', text: 'Joined your workspace as Data Analyst', at: iso(12), kind: 'hire' },
  ...historySeed,
];

const seedState: WorkspaceState = {
  hires: [
    { employeeId: 'emp_ava', hiredAt: iso(64), status: 'active', tasksCompleted: 128, utilization: 82 },
    { employeeId: 'emp_kai', hiredAt: iso(38), status: 'active', tasksCompleted: 402, utilization: 91 },
    { employeeId: 'emp_atlas', hiredAt: iso(12), status: 'active', tasksCompleted: 47, utilization: 64 },
  ],
  tasks: [
    {
      id: 'tsk_01',
      title: 'Build 40-account prospect list for mid-market fintech',
      employeeId: 'emp_ava',
      status: 'in_progress',
      priority: 'High',
      due: dueIn(1),
      detail: 'ICP: 200–800 employees, payments or lending, hiring ops roles. Include a personalized first line per account.',
    },
    {
      id: 'tsk_02',
      title: 'Draft sequence v2 with the reconciliation angle',
      employeeId: 'emp_ava',
      status: 'review',
      priority: 'High',
      due: dueIn(0),
      detail: 'Three touches, under 90 words each, no attachments. Reply triage rules attached.',
    },
    {
      id: 'tsk_03',
      title: 'Clear northeast carrier delay tickets',
      employeeId: 'emp_kai',
      status: 'in_progress',
      priority: 'High',
      due: dueIn(0),
      detail: 'Apply the delay macro, offer 10% credit past promise date, escalate refunds above $150.',
    },
    {
      id: 'tsk_04',
      title: 'Write a proactive delay email for 400 in-transit orders',
      employeeId: 'emp_kai',
      status: 'backlog',
      priority: 'Medium',
      due: dueIn(2),
      detail: 'Tone: calm and specific. Include revised delivery windows and a one-click help link.',
    },
    {
      id: 'tsk_05',
      title: 'Revenue churn readout for October',
      employeeId: 'emp_atlas',
      status: 'done',
      priority: 'High',
      due: dueIn(-2),
      detail: 'Logo vs revenue churn, cohort split before and after the pricing change.',
    },
    {
      id: 'tsk_06',
      title: 'Monday insight memo: activation drop investigation',
      employeeId: 'emp_atlas',
      status: 'review',
      priority: 'Medium',
      due: dueIn(1),
      detail: 'Check iOS web checkout redirect timing. Include volume impact and recommended fix owner.',
    },
    {
      id: 'tsk_07',
      title: 'Refresh the help-center macro library',
      employeeId: 'emp_kai',
      status: 'backlog',
      priority: 'Low',
      due: dueIn(5),
      detail: 'Merge 14 overlapping macros, rewrite the top 5 in plain language.',
    },
    {
      id: 'tsk_08',
      title: 'Weekly pipeline source report',
      employeeId: 'emp_ava',
      status: 'done',
      priority: 'Medium',
      due: dueIn(-1),
      detail: 'Meetings booked by source, reply rate by sequence, and the next best segment.',
    },
    {
      id: 'tsk_09',
      title: 'Save-play list for 11 at-risk accounts',
      employeeId: 'emp_atlas',
      status: 'backlog',
      priority: 'High',
      due: dueIn(3),
      detail: 'Usage signals, champion status, and a recommended outreach owner per account.',
    },
  ],
  messages: [
    {
      id: 'msg_01',
      employeeId: 'emp_ava',
      from: 'employee',
      text: 'Morning. 20 accounts are queued for the fintech sequence at 8:10am local. Two warm replies came in overnight — I drafted responses and held them for your review.',
      at: iso(0, 3),
    },
    {
      id: 'msg_02',
      employeeId: 'emp_ava',
      from: 'human',
      text: 'Send the responses, they look good. How is the rest of the list shaping up?',
      at: iso(0, 2),
    },
    {
      id: 'msg_03',
      employeeId: 'emp_ava',
      from: 'employee',
      text: 'Sent. The remaining 220 accounts are scored and staged. I am holding volume until we see 48-hour reply rate — currently 9.4%, above the 6% baseline.',
      at: iso(0, 2),
    },
    {
      id: 'msg_04',
      employeeId: 'emp_kai',
      from: 'employee',
      text: 'Queue is at 31 open tickets, down from 143 this morning. All carrier delays are answered; the 4 refunds above my limit are waiting on your approval in Tasks.',
      at: iso(0, 5),
    },
    {
      id: 'msg_05',
      employeeId: 'emp_atlas',
      from: 'employee',
      text: 'Churn memo is ready: revenue churn up 70bps, 82% concentrated in four accounts post price change. Want the one-pager or the full cohort breakdown?',
      at: iso(0, 8),
    },
  ],
  activities: [...seedActivityList].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  ),
};

const readState = (): WorkspaceState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    if (!parsed.hires || !parsed.tasks || !parsed.messages || !parsed.activities) return seedState;
    return parsed as WorkspaceState;
  } catch {
    return seedState;
  }
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isReady: authReady } = useAuth();
  // Supabase accounts get Postgres-backed state; the demo account and guests keep the
  // localStorage workspace so the product still works with no backend configured.
  const remote = backendConfigured && !!user && !user.id.startsWith('usr_');

  const [state, setState] = useState<WorkspaceState>(seedState);
  const [hydrated, setHydrated] = useState(false);

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const [billing, setBilling] = useState<WorkspaceBilling | null>(null);

  // Runs in flight and the last deliverable per task live here rather than in a page, because an
  // assignment now starts work by itself: the task sheet, the board and the overview all need to
  // see the same run, and navigating between them must not lose it.
  const [runningTaskIds, setRunningTaskIds] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<Record<string, Deliverable>>({});
  // Keyed by task id so a double click cannot start the same task twice.
  const inflight = useRef(new Map<string, Promise<TaskRunResult>>());

  const refreshBilling = useCallback(async () => {
    if (!remote) return;
    try {
      setBilling(await fetchWorkspaceBilling());
    } catch {
      /* no backend, or a demo account: nothing is billed, so nothing is locked */
    }
  }, [remote]);

  const refresh = useCallback(async () => {
    // Nothing to re-read in the demo workspace, and no billing to ask about.
    if (!remote) return;
    try {
      setState(await fetchWorkspace());
    } catch {
      /* keep the optimistic state; the next mutation retries */
    }
    // A webhook can change the subscription between two page loads, so the lock travels with the
    // snapshot rather than waiting for someone to open Billing.
    await refreshBilling();
  }, [remote, refreshBilling]);

  const loadWorkspaces = useCallback(async () => {
    try {
      const [list, current] = await Promise.all([fetchWorkspaces(), getWorkspaceId()]);
      setWorkspaces(list);
      setActiveId(current);
    } catch {
      /* single-workspace accounts and the demo simply keep the static label */
    }
  }, []);

  useEffect(() => {
    // Wait for the session check, otherwise a signed-in user briefly sees demo data.
    if (!authReady) return;

    if (!remote) {
      setState(readState());
      setHydrated(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        // A fresh account has no workspace until this runs; existing ones just get their id back.
        await ensureWorkspace(user?.company);
        const snapshot = await fetchWorkspace();
        if (!cancelled) setState(snapshot);
        if (!cancelled) void loadWorkspaces();
        if (!cancelled) void refreshBilling();
      } catch {
        if (!cancelled) setState({ hires: [], tasks: [], messages: [], activities: [] });
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, remote, user?.id, user?.company, loadWorkspaces]);

  useEffect(() => {
    if (!hydrated || remote || !authReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated, remote, authReady]);

  const hire = useCallback((employeeId: string) => {
    const person = getEmployeeById(employeeId);
    if (!person) return;
    // A paused workspace cannot add employees; the hires trigger would reject the row anyway.
    if (billing?.aiLocked) return;
    if (remote) {
      void createRemoteHire(employeeId, `${person.name} joined your workspace as ${person.role}`)
        .then(refresh)
        .catch(() => null);
    }
    setState((current) => {
      if (current.hires.some((h) => h.employeeId === employeeId)) return current;
      return {
        ...current,
        hires: [
          ...current.hires,
          { employeeId, hiredAt: new Date().toISOString(), status: 'active', tasksCompleted: 0, utilization: 12 },
        ],
        activities: [
          {
            id: `act_${Date.now()}`,
            employeeId,
            text: `${person.name} joined your workspace as ${person.role}`,
            at: new Date().toISOString(),
            kind: 'hire',
          },
          ...current.activities,
        ],
      };
    });
  }, [remote, refresh, billing?.aiLocked]);

  const release = useCallback((employeeId: string) => {
    if (remote) void deleteRemoteHire(employeeId).then(refresh).catch(() => null);
    setState((current) => ({
      ...current,
      hires: current.hires.filter((h) => h.employeeId !== employeeId),
      tasks: current.tasks.filter((t) => t.employeeId !== employeeId),
    }));
  }, [remote, refresh]);

  const togglePause = useCallback((employeeId: string) => {
    if (remote) {
      const target = state.hires.find((entry) => entry.employeeId === employeeId);
      if (target) {
        void setHireStatus(employeeId, target.status === 'active' ? 'paused' : 'active')
          .then(refresh)
          .catch(() => null);
      }
    }
    setState((current) => ({
      ...current,
      hires: current.hires.map((h) =>
        h.employeeId === employeeId ? { ...h, status: h.status === 'active' ? 'paused' : 'active' } : h,
      ),
    }));
  }, [remote, state.hires, refresh]);

  const moveTask = useCallback((taskId: string, status: TaskStatus) => {
    // Optimistic ids are not database ids; only sync rows that came from Postgres.
    if (remote && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(taskId)) {
      void setTaskStatus(taskId, status).then(refresh).catch(() => null);
    }
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    }));
  }, [remote, refresh]);

  const appendMessage = useCallback(
    (employeeId: string, text: string, from: 'human' | 'employee' = 'human') => {
      if (remote) void createRemoteMessage(employeeId, text, from).then(refresh).catch(() => null);
      setState((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            employeeId,
            from,
            text,
            at: new Date().toISOString(),
          },
        ],
      }));
    },
    [remote, refresh],
  );

  const deliverableFor = useCallback<WorkspaceContextValue['deliverableFor']>(
    (taskId) => deliverables[taskId] ?? null,
    [deliverables],
  );

  /** Why this employee cannot work right now, or null when they can. */
  const blockReason = useCallback(
    (employeeId: string): 'locked' | 'paused' | null => {
      if (billing?.aiLocked) return 'locked';
      if (state.hires.find((hire) => hire.employeeId === employeeId)?.status === 'paused') {
        return 'paused';
      }
      return null;
    },
    [billing?.aiLocked, state.hires],
  );

  /**
   * Runs one task end to end: in progress, deliverable, then review. The same function backs the
   * Run button and the automatic first pass after an assignment, so the two cannot drift apart.
   *
   * A failure hands the task back to the backlog instead of leaving a card spinning in In progress
   * — the next Run is a retry, not a second run of something that never finished.
   */
  const startTask = useCallback<WorkspaceContextValue['startTask']>(
    (task) => {
      const existing = inflight.current.get(task.id);
      if (existing) return existing;

      const person = getEmployeeById(task.employeeId);
      if (!person) {
        return Promise.resolve({ ok: false, reason: 'unreachable' } as TaskRunResult);
      }

      const blocked = blockReason(task.employeeId);
      if (blocked) return Promise.resolve({ ok: false, reason: blocked } as TaskRunResult);

      const run = (async (): Promise<TaskRunResult> => {
        setRunningTaskIds((ids) => (ids.includes(task.id) ? ids : [...ids, task.id]));
        moveTask(task.id, 'in_progress');
        try {
          const outcome = await runTask(task, person);

          if (outcome.ok) {
            setDeliverables((current) => ({
              ...current,
              [task.id]: { text: outcome.deliverable, provider: outcome.provider },
            }));
            moveTask(task.id, 'review');
            await refresh();
            return { ok: true, text: outcome.deliverable, provider: outcome.provider };
          }

          // No backend means the local demo: the same template the sheet has always shown, posted
          // to the thread so the workspace behaves like the real one.
          if (outcome.reason === 'no_backend') {
            const text = scriptedDeliverable(task, person);
            setDeliverables((current) => ({ ...current, [task.id]: { text, provider: null } }));
            appendMessage(task.employeeId, text, 'employee');
            moveTask(task.id, 'review');
            return { ok: true, text, provider: null };
          }

          moveTask(task.id, 'backlog');
          return { ok: false, reason: outcome.reason, detail: outcome.detail };
        } catch {
          moveTask(task.id, 'backlog');
          return { ok: false, reason: 'unreachable' };
        } finally {
          inflight.current.delete(task.id);
          setRunningTaskIds((ids) => ids.filter((id) => id !== task.id));
        }
      })();

      inflight.current.set(task.id, run);
      return run;
    },
    [appendMessage, blockReason, moveTask, refresh],
  );

  const addTask = useCallback<WorkspaceContextValue['addTask']>(
    async (input) => {
      const localId = `tsk_${Date.now()}`;
      const draft: Task = {
        id: localId,
        title: input.title,
        employeeId: input.employeeId,
        status: 'backlog',
        priority: input.priority,
        due: input.due ?? dueIn(3),
        detail: input.detail?.trim() || NO_BRIEF_DETAIL,
      };
      setState((current) => ({ ...current, tasks: [draft, ...current.tasks] }));

      let task = draft;
      if (remote) {
        try {
          const id = await createRemoteTask({ ...input, detail: draft.detail });
          task = { ...draft, id };
          setState((current) => ({
            ...current,
            tasks: current.tasks.map((entry) => (entry.id === localId ? task : entry)),
          }));
        } catch {
          // The row never landed, so a run would have nothing to read. Say so instead of firing a
          // request that can only come back as task_not_found.
          return { task: draft, start: null, blocked: 'not_saved' };
        }
      }

      const blocked = blockReason(task.employeeId);
      if (blocked) return { task, start: null, blocked };

      return { task, start: startTask(task) };
    },
    [blockReason, remote, startTask],
  );

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!remote || workspaceId === activeId) return;
      setSwitching(true);
      try {
        await switchRemoteWorkspace(workspaceId);
        setActiveId(workspaceId);
        await refresh();
      } finally {
        setSwitching(false);
      }
    },
    [remote, activeId, refresh],
  );

  const createWorkspace = useCallback(
    async (name: string) => {
      if (!remote) return;
      setSwitching(true);
      try {
        await createRemoteWorkspace(name);
        await loadWorkspaces();
        await refresh();
      } finally {
        setSwitching(false);
      }
    },
    [remote, loadWorkspaces, refresh],
  );

  const renameActiveWorkspace = useCallback(
    async (name: string) => {
      if (!remote || !activeId) return;
      setSwitching(true);
      try {
        await renameRemoteWorkspace(activeId, name);
        await loadWorkspaces();
      } finally {
        setSwitching(false);
      }
    },
    [remote, activeId, loadWorkspaces],
  );

  const deleteActiveWorkspace = useCallback(async () => {
    if (!remote || !activeId) return;
    setSwitching(true);
    try {
      await deleteRemoteWorkspace(activeId);
      // The server already moved the profile to the oldest remaining workspace, so reloading the
      // list (which re-reads my_workspace) and the snapshot lands on the right workspace.
      await loadWorkspaces();
      await refresh();
    } finally {
      setSwitching(false);
    }
  }, [remote, activeId, loadWorkspaces, refresh]);

  const leaveActiveWorkspace = useCallback(async () => {
    if (!remote || !activeId) return;
    setSwitching(true);
    try {
      await leaveRemoteWorkspace(activeId);
      // The server cleared or moved the profile's workspace, so re-reading both lands on whatever
      // is left — and ensure_workspace() hands a fresh empty one to someone who has none.
      await loadWorkspaces();
      await refresh();
    } finally {
      setSwitching(false);
    }
  }, [remote, activeId, loadWorkspaces, refresh]);

  const completedThisMonth = useMemo(
    () => state.hires.reduce((sum, hire) => sum + Math.round(hire.tasksCompleted * 0.22), 0) + state.tasks.filter((t) => t.status === 'done').length,
    [state.hires, state.tasks],
  );

  const hoursSaved = useMemo(
    () =>
      state.hires.reduce((sum, hire) => {
        const person = employees.find((e) => e.id === hire.employeeId);
        return sum + (person ? Math.round(person.hoursSavedPerWeek * 4.2) : 0);
      }, 0),
    [state.hires],
  );

  const utilization = useMemo(() => {
    if (!state.hires.length) return 0;
    return Math.round(state.hires.reduce((sum, hire) => sum + hire.utilization, 0) / state.hires.length);
  }, [state.hires]);

  const monthlySpend = useMemo(
    () =>
      state.hires.reduce((sum, hire) => {
        const person = getEmployeeById(hire.employeeId);
        return sum + (person?.priceMonthly ?? 0);
      }, 0),
    [state.hires],
  );

  const value = useMemo(
    () => ({
      ...state,
      hire,
      release,
      togglePause,
      addTask,
      startTask,
      runningTaskIds,
      deliverableFor,
      moveTask,
      appendMessage,
      completedThisMonth,
      hoursSaved,
      utilization,
      monthlySpend,
      billing,
      aiLocked: Boolean(billing?.aiLocked),
      billingStatus: billing?.status ?? null,
      refreshBilling,
      workspaces,
      activeWorkspace: workspaces.find((workspace) => workspace.id === activeId) ?? null,
      switching,
      switchWorkspace,
      createWorkspace,
      renameActiveWorkspace,
      deleteActiveWorkspace,
      leaveActiveWorkspace,
      refreshWorkspace: refresh,
    }),
    [state, hire, release, togglePause, addTask, moveTask, appendMessage, completedThisMonth, hoursSaved, utilization, monthlySpend, billing, refreshBilling, workspaces, activeId, switching, switchWorkspace, createWorkspace, renameActiveWorkspace, deleteActiveWorkspace, leaveActiveWorkspace, refresh],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return context;
}

export function replyFor(employeeId: string, message: string): string {
  const person = getEmployeeById(employeeId);
  const lower = message.toLowerCase();
  if (!person) return 'Got it — I will take that from here.';

  if (/(hi|hello|hey|morning|afternoon)\b/.test(lower) && lower.length < 40) {
    return `Morning. I am caught up on the queue and ready — ${person.deliverables[0].toLowerCase()} is already in motion. What should I prioritise today?`;
  }
  if (/(report|update|status|progress)/.test(lower)) {
    return `Status: 3 items in flight, 1 waiting on your approval. Nothing is blocked on my side. I will have the ${person.deliverables[0].toLowerCase()} ready for review before end of day.`;
  }
  if (/(thank|great|nice|perfect|good job)/.test(lower)) {
    return 'Anytime. I logged this as a win for the week and will reuse the approach where it fits.';
  }
  if (/(price|cost|budget|invoice)/.test(lower)) {
    return 'Noted. I have flagged it for the finance view and will keep spend inside the current policy. If this needs approval, it will appear in your Tasks queue with the numbers attached.';
  }
  if (/(urgent|asap|now|today)/.test(lower)) {
    return 'Reprioritising now. I moved this to the top of my queue and will send the first pass within the hour — with a short note on anything I had to deprioritise.';
  }

  const generic = [
    `Understood. I am pulling the context from ${person.tools.slice(0, 2).join(' and ')} and will come back with a first draft you can react to.`,
    `On it. My plan: gather the inputs, do the work to your playbook, then hand you the finished output with a two-line summary. Anything you want excluded?`,
    `Clear. I will start with the highest-leverage part and check in only if a decision is needed. Expect something reviewable shortly.`,
  ];
  return generic[Math.floor(Math.random() * generic.length)];
}
