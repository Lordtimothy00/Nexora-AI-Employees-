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

/**
 * Asks the `employee-reply` edge function for a real answer.
 *
 * Returns `null` whenever the model is unavailable — no Supabase, no function deployed, no
 * provider key, a network failure, or a malformed response. Callers fall back to the scripted
 * `replyFor()` templates, so the product never breaks, it just stops being clever.
 */
export async function requestEmployeeReply(request: ReplyRequest): Promise<string | null> {
  const pending = getSupabase();
  if (!pending) return null;

  try {
    const db = await pending;
    const { data, error } = await db.functions.invoke('employee-reply', { body: request });
    if (error) return null;

    const reply = (data as { reply?: unknown } | null)?.reply;
    if (typeof reply !== 'string') return null;

    const trimmed = reply.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}
