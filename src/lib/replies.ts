import type { Employee } from '@/data/employees';
import { getSupabase } from './supabase';

export type ReplySeed = Pick<
  Employee,
  'name' | 'role' | 'tagline' | 'deliverables' | 'skills' | 'tools'
>;

export interface ReplyRequest {
  employee: ReplySeed;
  history: { from: 'human' | 'employee'; text: string }[];
  message: string;
}

/** Why a real reply did not arrive. Each one has a different remedy, so we keep them apart. */
export type ReplyFailureReason =
  | 'no_backend'
  | 'no_session'
  | 'unauthorized'
  | 'not_configured'
  | 'provider_error'
  | 'unreachable';

export type ReplyOutcome =
  | { ok: true; reply: string; provider: string }
  | { ok: false; reply: null; reason: ReplyFailureReason; detail?: string };

const trimDetail = (value: unknown, limit = 140) => {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text || undefined;
};

/** Supabase wraps HTTP failures in `error.context`, a Response we can read once. */
async function readError(error: unknown): Promise<{ status?: number; detail?: string }> {
  const context = (error as { context?: Response })?.context;
  if (!context || typeof context.clone !== 'function') {
    return { detail: trimDetail((error as { message?: string })?.message) };
  }

  let body: { error?: unknown; detail?: unknown } | null = null;
  try {
    body = await context.clone().json();
  } catch {
    /* not JSON, the status is still useful */
  }

  return {
    status: context.status,
    detail: trimDetail(body?.detail ?? body?.error),
  };
}

/**
 * Asks the `employee-reply` edge function for a real answer.
 *
 * Always resolves — callers fall back to the scripted `replyFor()` templates — but a failure
 * carries its reason so the UI can say which mode it is in instead of quietly pretending.
 */
export async function requestEmployeeReply(request: ReplyRequest): Promise<ReplyOutcome> {
  const pending = getSupabase();
  if (!pending) return { ok: false, reply: null, reason: 'no_backend' };

  let db;
  try {
    db = await pending;
  } catch {
    return { ok: false, reply: null, reason: 'unreachable' };
  }

  // The demo workspace is local-only, so an unauthenticated call would be rejected anyway.
  // Saying so up front keeps the reason honest and skips a doomed round trip.
  try {
    const { data } = await db.auth.getSession();
    if (!data.session) return { ok: false, reply: null, reason: 'no_session' };
  } catch {
    return { ok: false, reply: null, reason: 'no_session' };
  }

  try {
    const { data, error } = await db.functions.invoke('employee-reply', { body: request });
    if (error) {
      const { status, detail } = await readError(error);
      if (status === 401 || status === 403) return { ok: false, reply: null, reason: 'unauthorized', detail };
      if (status === 501) return { ok: false, reply: null, reason: 'not_configured' };
      if (status === 502) return { ok: false, reply: null, reason: 'provider_error', detail };
      return { ok: false, reply: null, reason: 'unreachable', detail };
    }

    const payload = data as { reply?: unknown; provider?: unknown } | null;
    const reply = typeof payload?.reply === 'string' ? payload.reply.trim() : '';
    if (!reply) return { ok: false, reply: null, reason: 'provider_error', detail: 'empty reply' };

    return {
      ok: true,
      reply,
      provider: typeof payload?.provider === 'string' ? payload.provider : 'model',
    };
  } catch (error) {
    return { ok: false, reply: null, reason: 'unreachable', detail: trimDetail((error as Error)?.message) };
  }
}

/** One sentence a person can act on, shown next to the scripted reply. */
export function explainReplyFailure(
  reason: ReplyFailureReason,
  detail?: string,
): string {
  // Out of credits arrives as a 502 with a provider payload; say it in plain words.
  if (/insufficient_quota|no credits remaining/i.test(detail ?? '')) {
    return 'Scripted replies — the model provider account has run out of credits.';
  }

  switch (reason) {
    case 'no_backend':
      return 'Scripted replies — this build has no backend configured.';
    case 'no_session':
      return 'Scripted replies — the demo workspace is local-only. Sign in with a real account to reach the model.';
    case 'unauthorized':
      return 'Scripted replies — the function rejected the session (401).';
    case 'not_configured':
      return 'Scripted replies — no model key is set on the project (501).';
    case 'provider_error':
      return 'Scripted replies — the model refused the request (502).';
    case 'unreachable':
    default:
      return 'Scripted replies — the function could not be reached.';
  }
}
