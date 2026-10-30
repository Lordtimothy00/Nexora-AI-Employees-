import type { Activity, ChatMessage, Hire, Priority, Task, TaskStatus } from '@/context/WorkspaceContext';
import { getSupabase } from './supabase';

export interface WorkspaceSnapshot {
  hires: Hire[];
  tasks: Task[];
  messages: ChatMessage[];
  activities: Activity[];
}

type HireRow = {
  employee_id: string;
  hired_at: string;
  status: Hire['status'];
  tasks_completed: number;
  utilization: number;
};

type TaskRow = {
  id: string;
  employee_id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  detail: string;
};

type MessageRow = {
  id: string;
  employee_id: string;
  sender: 'human' | 'employee';
  body: string;
  created_at: string;
};

type ActivityRow = {
  id: string;
  employee_id: string;
  body: string;
  kind: Activity['kind'];
  created_at: string;
};

async function client() {
  const pending = getSupabase();
  if (!pending) throw new Error('Supabase is not configured.');
  return pending;
}

export const EMPTY_WORKSPACE: WorkspaceSnapshot = { hires: [], tasks: [], messages: [], activities: [] };

/** Everything the signed-in user owns, newest activity first. */
export async function fetchWorkspace(): Promise<WorkspaceSnapshot> {
  const db = await client();
  const [hires, tasks, messages, activities] = await Promise.all([
    db.from('hires').select('employee_id, hired_at, status, tasks_completed, utilization').order('hired_at', { ascending: true }),
    db.from('tasks').select('id, employee_id, title, status, priority, due, detail').order('created_at', { ascending: true }),
    db.from('messages').select('id, employee_id, sender, body, created_at').order('created_at', { ascending: true }),
    db.from('activities').select('id, employee_id, body, kind, created_at').order('created_at', { ascending: false }).limit(120),
  ]);

  const failure = hires.error ?? tasks.error ?? messages.error ?? activities.error;
  if (failure) throw new Error(failure.message);

  return {
    hires: (hires.data as HireRow[]).map((row) => ({
      employeeId: row.employee_id,
      hiredAt: row.hired_at,
      status: row.status,
      tasksCompleted: row.tasks_completed,
      utilization: row.utilization,
    })),
    tasks: (tasks.data as TaskRow[]).map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      due: row.due,
      detail: row.detail,
    })),
    messages: (messages.data as MessageRow[]).map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      from: row.sender,
      text: row.body,
      at: row.created_at,
    })),
    activities: (activities.data as ActivityRow[]).map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      text: row.body,
      kind: row.kind,
      at: row.created_at,
    })),
  };
}

export async function createHire(employeeId: string, activityText: string) {
  const db = await client();
  const { error } = await db
    .from('hires')
    .upsert({ employee_id: employeeId }, { onConflict: 'user_id,employee_id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  await db.from('activities').insert({ employee_id: employeeId, body: activityText, kind: 'hire' });
}

export async function deleteHire(employeeId: string) {
  const db = await client();
  const { error } = await db.from('hires').delete().eq('employee_id', employeeId);
  if (error) throw new Error(error.message);

  await Promise.all([
    db.from('tasks').delete().eq('employee_id', employeeId),
    db.from('messages').delete().eq('employee_id', employeeId),
  ]);
}

export async function setHireStatus(employeeId: string, status: Hire['status']) {
  const db = await client();
  const { error } = await db.from('hires').update({ status }).eq('employee_id', employeeId);
  if (error) throw new Error(error.message);
}

export async function createTask(input: {
  title: string;
  employeeId: string;
  priority: Priority;
  due?: string;
  detail?: string;
}) {
  const db = await client();
  const { error } = await db.from('tasks').insert({
    title: input.title,
    employee_id: input.employeeId,
    priority: input.priority,
    due: input.due ?? '',
    detail: input.detail ?? '',
    status: 'backlog',
  });
  if (error) throw new Error(error.message);
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const db = await client();
  const { error } = await db.from('tasks').update({ status }).eq('id', taskId);
  if (error) throw new Error(error.message);
}

export async function createMessage(employeeId: string, body: string, from: 'human' | 'employee') {
  const db = await client();
  const { error } = await db.from('messages').insert({
    employee_id: employeeId,
    body,
    sender: from,
  });
  if (error) throw new Error(error.message);
}

export async function updateProfile(
  patch: Partial<{ name: string; company: string; role: string; plan: string }>,
) {
  const db = await client();
  const { data: session } = await db.auth.getUser();
  if (!session.user) return;

  const { error } = await db.from('profiles').upsert({ id: session.user.id, ...patch });
  if (error) throw new Error(error.message);
}

export interface RemoteProfile {
  name: string;
  company: string;
  role: string;
  plan: 'launch' | 'growth' | 'scale';
  created_at: string;
}

export async function fetchProfile(): Promise<RemoteProfile | null> {
  const db = await client();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await db
    .from('profiles')
    .select('name, company, role, plan, created_at')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as RemoteProfile | null) ?? null;
}
