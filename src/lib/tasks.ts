import type { Employee } from '@/data/employees';
import type { Task } from '@/context/WorkspaceContext';
import { getWorkspaceId } from './backend';
import { getSupabase } from './supabase';

/**
 * Runs one task through the `run-task` edge function: the employee produces the deliverable, which
 * the function writes into the thread, the activity feed, and the board (as `review`).
 *
 * Only the id is sent for the task — the function reads the brief from the database, so a browser
 * cannot ask an employee to "deliver" something that was never assigned.
 */

export type RunSeed = Pick<Task, 'id' | 'title' | 'detail' | 'priority' | 'due'>;
export type RunEmployee = Pick<
  Employee,
  'name' | 'role' | 'tagline' | 'deliverables' | 'skills' | 'tools'
>;

export type RunFailureReason =
  | 'no_backend'
  | 'no_session'
  | 'unauthorized'
  | 'not_member'
  | 'task_not_found'
  | 'payment_required'
  | 'rate_limited'
  | 'not_configured'
  | 'provider_error'
  | 'unreachable';

export type RunOutcome =
  | { ok: true; deliverable: string; provider: string }
  | { ok: false; reason: RunFailureReason; detail?: string };

const trimDetail = (value: unknown, limit = 140) => {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text || undefined;
};

async function readError(error: unknown): Promise<{ status?: number; detail?: string }> {
  const context = (error as { context?: Response })?.context;
  if (!context || typeof context.clone !== 'function') {
    return { detail: trimDetail((error as { message?: string })?.message) };
  }

  let body: { error?: unknown; detail?: unknown } | null = null;
  try {
    body = await context.clone().json();
  } catch {
    /* not JSON; the status still narrows it down */
  }

  return { status: context.status, detail: trimDetail(body?.detail ?? body?.error) };
}

export async function runTask(task: RunSeed, employee: RunEmployee): Promise<RunOutcome> {
  const pending = getSupabase();
  if (!pending) return { ok: false, reason: 'no_backend' };

  let db;
  let workspaceId: string;
  try {
    db = await pending;
    const { data } = await db.auth.getSession();
    if (!data.session) return { ok: false, reason: 'no_session' };
    workspaceId = await getWorkspaceId();
  } catch {
    return { ok: false, reason: 'unreachable' };
  }

  try {
    const { data, error } = await db.functions.invoke('run-task', {
      body: {
        workspaceId,
        taskId: task.id,
        employee: {
          name: employee.name,
          role: employee.role,
          tagline: employee.tagline,
          deliverables: employee.deliverables,
          skills: employee.skills,
          tools: employee.tools,
        },
      },
    });

    if (error) {
      const { status, detail } = await readError(error);
      if (status === 402) return { ok: false, reason: 'payment_required', detail };
      if (status === 429) return { ok: false, reason: 'rate_limited', detail };
      if (status === 404) return { ok: false, reason: 'task_not_found', detail };
      if (status === 403) return { ok: false, reason: 'not_member', detail };
      if (status === 401) return { ok: false, reason: 'unauthorized', detail };
      if (status === 501) return { ok: false, reason: 'not_configured', detail };
      if (status === 502) return { ok: false, reason: 'provider_error', detail };
      return { ok: false, reason: 'unreachable', detail };
    }

    const payload = data as { deliverable?: unknown; provider?: unknown } | null;
    const deliverable = typeof payload?.deliverable === 'string' ? payload.deliverable.trim() : '';
    if (!deliverable) return { ok: false, reason: 'provider_error', detail: 'empty deliverable' };

    return {
      ok: true,
      deliverable,
      provider: typeof payload?.provider === 'string' ? payload.provider : 'model',
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'unreachable',
      detail: trimDetail((error as Error)?.message ?? error),
    };
  }
}

/**
 * The local demo has no model behind it, so this is a template built from the brief. It says so in
 * the first paragraph — a demo that pretends to have done the work is worse than no demo.
 */
export function scriptedDeliverable(task: RunSeed, employee: Pick<RunEmployee, 'name' | 'role'>) {
  const brief = task.detail?.trim() || task.title;

  return [
    `Draft from ${employee.name} · ${employee.role}`,
    '',
    `Scripted deliverable for “${task.title}” — the demo workspace runs locally, so no model was called. The same button returns real work once a member is signed in.`,
    '',
    'Brief as I understood it',
    brief,
    '',
    'What I would do',
    '1. Gather the inputs the brief names, and note anything missing before starting.',
    '2. Draft in your voice, inside the approval limits on this workspace.',
    '3. Hand it back for review with any open questions listed at the end.',
    '',
    'Open question: which of those would you like me to start with?',
  ].join('\n');
}

/** One sentence a person can act on when a run does not produce work. */
export function explainRunFailure(reason: RunFailureReason, detail?: string): string {
  if (/insufficient_quota|no credits remaining/i.test(detail ?? '')) {
    return 'The model provider account has run out of credits — top it up and run again.';
  }

  switch (reason) {
    case 'no_backend':
      return 'Scripted — this build has no backend, so the demo produced a template instead.';
    case 'no_session':
      return 'Sign in with a real account to run tasks.';
    case 'unauthorized':
      return 'Your session expired — sign in again to run this task.';
    case 'not_member':
      return 'Only members of this workspace can run its tasks.';
    case 'task_not_found':
      return 'That task no longer exists in this workspace.';
    case 'payment_required':
      return 'AI employees are paused until billing is settled — update payment in Billing to unlock them.';
    case 'rate_limited':
      return 'This workspace hit the hourly run limit — try again shortly.';
    case 'not_configured':
      return 'No model key is set on this project, so nothing can be generated yet.';
    case 'provider_error':
      return 'The model refused the request — nothing was written to the board.';
    case 'unreachable':
    default:
      return 'Could not reach the runner — nothing was written to the board.';
  }
}
