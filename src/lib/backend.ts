import type { Activity, ChatMessage, Hire, Priority, Task, TaskStatus } from '@/context/WorkspaceContext';
import { getSupabase } from './supabase';
import { explainInviteFailure, type InviteOutcome } from './invites';
import type { NotificationPrefs } from './prefs';

export interface WorkspaceSnapshot {
  hires: Hire[];
  tasks: Task[];
  messages: ChatMessage[];
  activities: Activity[];
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  company: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  token: string;
  createdAt: string;
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

export const EMPTY_WORKSPACE: WorkspaceSnapshot = { hires: [], tasks: [], messages: [], activities: [] };

async function client() {
  const pending = getSupabase();
  if (!pending) throw new Error('Supabase is not configured.');
  return pending;
}

/** Cached so a screen with five queries does not make five round trips for the id. */
let activeWorkspaceId: string | null = null;

export function resetWorkspaceCache() {
  activeWorkspaceId = null;
}

export async function ensureWorkspace(name?: string): Promise<string> {
  const db = await client();
  const { data, error } = await db.rpc('ensure_workspace', { p_name: name ?? null });
  if (error) throw new Error(error.message);
  activeWorkspaceId = data as string;
  return activeWorkspaceId;
}

export async function getWorkspaceId(): Promise<string> {
  if (activeWorkspaceId) return activeWorkspaceId;

  const db = await client();
  const { data, error } = await db.rpc('my_workspace');
  if (error) throw new Error(error.message);
  if (!data) return ensureWorkspace();

  activeWorkspaceId = data as string;
  return activeWorkspaceId;
}

/** Everything in the workspace the signed-in person is currently looking at. */
export async function fetchWorkspace(): Promise<WorkspaceSnapshot> {
  const db = await client();
  const ws = await getWorkspaceId();

  const [hires, tasks, messages, activities] = await Promise.all([
    db.from('hires').select('employee_id, hired_at, status, tasks_completed, utilization').eq('workspace_id', ws).order('hired_at', { ascending: true }),
    db.from('tasks').select('id, employee_id, title, status, priority, due, detail').eq('workspace_id', ws).order('created_at', { ascending: true }),
    db.from('messages').select('id, employee_id, sender, body, created_at').eq('workspace_id', ws).order('created_at', { ascending: true }),
    db.from('activities').select('id, employee_id, body, kind, created_at').eq('workspace_id', ws).order('created_at', { ascending: false }).limit(120),
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
  const ws = await getWorkspaceId();

  const { error } = await db
    .from('hires')
    .upsert(
      { workspace_id: ws, employee_id: employeeId },
      { onConflict: 'workspace_id,employee_id', ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);

  await db.from('activities').insert({ workspace_id: ws, employee_id: employeeId, body: activityText, kind: 'hire' });
}

export async function deleteHire(employeeId: string) {
  const db = await client();
  const ws = await getWorkspaceId();

  const { error } = await db.from('hires').delete().eq('workspace_id', ws).eq('employee_id', employeeId);
  if (error) throw new Error(error.message);

  await Promise.all([
    db.from('tasks').delete().eq('workspace_id', ws).eq('employee_id', employeeId),
    db.from('messages').delete().eq('workspace_id', ws).eq('employee_id', employeeId),
  ]);
}

export async function setHireStatus(employeeId: string, status: Hire['status']) {
  const db = await client();
  const ws = await getWorkspaceId();
  const { error } = await db.from('hires').update({ status }).eq('workspace_id', ws).eq('employee_id', employeeId);
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
  const ws = await getWorkspaceId();
  const { error } = await db.from('tasks').insert({
    workspace_id: ws,
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
  const ws = await getWorkspaceId();
  const { error } = await db.from('messages').insert({
    workspace_id: ws,
    employee_id: employeeId,
    body,
    sender: from,
  });
  if (error) throw new Error(error.message);
}

export async function updateProfile(
  patch: Partial<{
    name: string;
    company: string;
    role: string;
    plan: string;
    prefs: NotificationPrefs;
  }>,
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
  prefs?: unknown;
  created_at: string;
}

export async function fetchProfile(): Promise<RemoteProfile | null> {
  const db = await client();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await db
    .from('profiles')
    .select('name, company, role, plan, prefs, created_at')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as RemoteProfile | null) ?? null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: string;
  members: number;
}

export interface WorkspaceBilling {
  plan: 'launch' | 'growth' | 'scale' | null;
  status: string | null;
  interval: 'month' | 'year' | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
  subscriptionId: string | null;
  /** When this *account* first started its 3-day trial. Null means the trial is still unused. */
  trialStartedAt: string | null;
}

/**
 * What Stripe has actually said about the workspace the person is looking at. Everything is null or
 * false until a subscription exists — no plan is assumed on creation.
 */
export async function fetchWorkspaceBilling(): Promise<WorkspaceBilling | null> {
  const db = await client();
  const { data, error } = await db.rpc('workspace_billing');
  if (error) throw new Error(error.message);

  type Row = {
    plan: string | null;
    status: string | null;
    billing_interval: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
    has_customer: boolean | null;
    subscription_id: string | null;
    trial_started_at: string | null;
  };

  const row = ((data ?? []) as Row[])[0];
  if (!row) return null;

  return {
    plan: (row.plan as WorkspaceBilling['plan']) ?? null,
    status: row.status ?? null,
    interval: (row.billing_interval as 'month' | 'year' | null) ?? null,
    periodEnd: row.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    hasCustomer: Boolean(row.has_customer),
    subscriptionId: row.subscription_id ?? null,
    trialStartedAt: row.trial_started_at ?? null,
  };
}

/** Every workspace this person belongs to, newest last. Empty for the local demo account. */
export async function fetchWorkspaces(): Promise<WorkspaceSummary[]> {
  const db = await client();
  const { data, error } = await db.rpc('my_workspaces');
  if (error) throw new Error(error.message);

  type Row = { id: string; name: string | null; role: string | null; members: number | null };

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    name: row.name || 'Workspace',
    role: (row.role as string) || 'member',
    members: (row.members as number) ?? 1,
  }));
}

/**
 * Creates a workspace and makes it the active one. Names are trimmed and validated server-side
 * (non-empty, under 60 characters, at most 10 workspaces per account).
 */
export async function createWorkspace(name: string): Promise<string> {
  const db = await client();
  const { data, error } = await db.rpc('create_workspace', { p_name: name });
  if (error) throw new Error(error.message);
  resetWorkspaceCache();
  return data as string;
}

/**
 * Moves the signed-in person to another workspace. The id is persisted on their profile, so the
 * choice survives a reload, and the cached id is dropped so the next fetch reads the new one.
 */
export async function switchWorkspace(workspaceId: string): Promise<void> {
  const db = await client();
  const { error } = await db.rpc('switch_workspace', { p_workspace: workspaceId });
  if (error) throw new Error(error.message);
  resetWorkspaceCache();
}

/**
 * Renames a workspace. The server trims the name and throws on empty or 60+ characters, and it
 * refuses anyone who is not an owner or admin of that workspace.
 */
export async function renameWorkspace(workspaceId: string, name: string): Promise<string> {
  const db = await client();
  const { data, error } = await db.rpc('rename_workspace', { p_workspace: workspaceId, p_name: name });
  if (error) throw new Error(error.message);
  return (data as string) ?? name.trim();
}

/**
 * Deletes a workspace and everything inside it, then returns the workspace the caller is moved to.
 * The server refuses this for anyone but the owner, and for an account's only workspace.
 */
export async function deleteWorkspace(workspaceId: string): Promise<string> {
  const db = await client();
  const { data, error } = await db.rpc('delete_workspace', { p_workspace: workspaceId });
  if (error) throw new Error(error.message);
  resetWorkspaceCache();
  return data as string;
}

export async function fetchMembers(): Promise<WorkspaceMember[]> {
  const db = await client();
  const ws = await getWorkspaceId();

  const { data, error } = await db
    .from('workspace_members')
    .select('user_id, role, created_at')
    .eq('workspace_id', ws)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((row) => row.user_id as string);
  if (!ids.length) return [];

  const { data: profiles } = await db.from('profiles').select('id, name, company').in('id', ids);
  const byId = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));

  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    role: row.role as WorkspaceMember['role'],
    joinedAt: row.created_at as string,
    name: (byId.get(row.user_id as string)?.name as string) || 'Teammate',
    company: (byId.get(row.user_id as string)?.company as string) || '',
  }));
}

type FunctionErrorBody = { error?: unknown; detail?: unknown; token?: unknown; link?: unknown };

/** `functions.invoke` wraps non-2xx replies in `error.context`, a Response we can read once. */
async function readFunctionError(
  error: unknown,
): Promise<{ status?: number; body: FunctionErrorBody | null }> {
  const context = (error as { context?: Response })?.context;
  if (!context || typeof context.clone !== 'function') return { body: null };

  let body: FunctionErrorBody | null = null;
  try {
    body = (await context.clone().json()) as FunctionErrorBody;
  } catch {
    /* not JSON; the status still narrows it down */
  }

  return { status: context.status, body };
}

export async function fetchInvites(): Promise<WorkspaceInvite[]> {
  const db = await client();
  const ws = await getWorkspaceId();

  const { data, error } = await db
    .from('workspace_invites')
    .select('id, email, role, token, created_at')
    .eq('workspace_id', ws)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  // Only admins can read invites; anyone else simply sees none.
  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    role: row.role as WorkspaceInvite['role'],
    token: row.token as string,
    createdAt: row.created_at as string,
  }));
}

/** Removes someone else from the current workspace. Owner/admin only, enforced server-side. */
export async function removeMember(userId: string): Promise<void> {
  const db = await client();
  const ws = await getWorkspaceId();
  const { error } = await db.rpc('remove_member', { p_workspace: ws, p_user: userId });
  if (error) throw new Error(error.message);
}

/** Promotes or demotes a teammate. Only the workspace owner may do this. */
export async function setMemberRole(userId: string, role: 'admin' | 'member'): Promise<string> {
  const db = await client();
  const ws = await getWorkspaceId();
  const { data, error } = await db.rpc('set_member_role', { p_workspace: ws, p_user: userId, p_role: role });
  if (error) throw new Error(error.message);
  return (data as string) ?? role;
}

/**
 * Leaves a workspace. If the caller owned it, ownership passes to the oldest admin (else the oldest
 * member). The server moves their profile to the oldest workspace they still belong to and returns
 * that id, or null when they have none left.
 */
export async function leaveWorkspace(workspaceId: string): Promise<string | null> {
  const db = await client();
  const { data, error } = await db.rpc('leave_workspace', { p_workspace: workspaceId });
  if (error) throw new Error(error.message);
  resetWorkspaceCache();
  return (data as string | null) ?? null;
}

/**
 * Invites someone into the current workspace and asks the `invite-member` function to email them.
 *
 * The row is written server-side (the function checks the caller is an owner or admin first), so
 * this cannot be done by a browser that skipped the UI. Resolves with `emailed: false` when the
 * invite exists but no mail went out — the caller then hands over the link instead.
 */
export async function inviteMember(
  email: string,
  role: WorkspaceInvite['role'] = 'member',
): Promise<InviteOutcome> {
  const db = await client();
  const ws = await getWorkspaceId();
  const origin = window.location.origin;

  const { data, error } = await db.functions.invoke('invite-member', {
    body: { workspaceId: ws, email: email.trim().toLowerCase(), role, origin },
  });

  if (error) {
    const { status, body } = await readFunctionError(error);
    const link = typeof body?.link === 'string' ? body.link : '';

    // The invite row exists and only the mail failed; the link is still worth having.
    if (body?.error === 'send_failed' && link) {
      return { emailed: false, link, reason: 'send_failed' };
    }

    throw new Error(explainInviteFailure(status, typeof body?.error === 'string' ? body.error : undefined));
  }

  const payload = data as { emailed?: unknown; link?: unknown; token?: unknown; reason?: unknown } | null;
  const link =
    typeof payload?.link === 'string' && payload.link
      ? payload.link
      : `${origin}/invite/${typeof payload?.token === 'string' ? payload.token : ''}`;

  return {
    emailed: payload?.emailed === true,
    link,
    reason: payload?.reason === 'has_account' ? 'has_account' : undefined,
  };
}

export async function revokeInvite(id: string) {
  const db = await client();
  const { error } = await db.from('workspace_invites').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function acceptInvite(token: string) {
  const db = await client();
  const { data, error } = await db.rpc('accept_invite', { p_token: token });
  if (error) throw new Error(error.message);
  resetWorkspaceCache();
  activeWorkspaceId = data as string;
  return activeWorkspaceId;
}
