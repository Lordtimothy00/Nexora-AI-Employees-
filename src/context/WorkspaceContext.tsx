import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { employees, getEmployeeById } from '@/data/employees';

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
  addTask: (input: { title: string; employeeId: string; priority: Priority; due?: string; detail?: string }) => void;
  moveTask: (taskId: string, status: TaskStatus) => void;
  appendMessage: (employeeId: string, text: string, from?: 'human' | 'employee') => void;
  completedThisMonth: number;
  hoursSaved: number;
  utilization: number;
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
  const [state, setState] = useState<WorkspaceState>(seedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const hire = useCallback((employeeId: string) => {
    const person = getEmployeeById(employeeId);
    if (!person) return;
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
  }, []);

  const release = useCallback((employeeId: string) => {
    setState((current) => ({
      ...current,
      hires: current.hires.filter((h) => h.employeeId !== employeeId),
      tasks: current.tasks.filter((t) => t.employeeId !== employeeId),
    }));
  }, []);

  const togglePause = useCallback((employeeId: string) => {
    setState((current) => ({
      ...current,
      hires: current.hires.map((h) =>
        h.employeeId === employeeId ? { ...h, status: h.status === 'active' ? 'paused' : 'active' } : h,
      ),
    }));
  }, []);

  const addTask = useCallback<WorkspaceContextValue['addTask']>((input) => {
    setState((current) => ({
      ...current,
      tasks: [
        {
          id: `tsk_${Date.now()}`,
          title: input.title,
          employeeId: input.employeeId,
          status: 'backlog',
          priority: input.priority,
          due: input.due ?? dueIn(3),
          detail: input.detail ?? 'Newly assigned. Your employee will confirm scope before starting.',
        },
        ...current.tasks,
      ],
    }));
  }, []);

  const moveTask = useCallback((taskId: string, status: TaskStatus) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    }));
  }, []);

  const appendMessage = useCallback(
    (employeeId: string, text: string, from: 'human' | 'employee' = 'human') => {
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
    [],
  );

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

  const value = useMemo(
    () => ({
      ...state,
      hire,
      release,
      togglePause,
      addTask,
      moveTask,
      appendMessage,
      completedThisMonth,
      hoursSaved,
      utilization,
    }),
    [state, hire, release, togglePause, addTask, moveTask, appendMessage, completedThisMonth, hoursSaved, utilization],
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
