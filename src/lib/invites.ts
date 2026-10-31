/**
 * Copy for inviting a teammate.
 *
 * The edge function does the sending, and it can come back in three shapes: the email went, the
 * address already belongs to a Nexora account (so no invite mail is possible and the admin has to
 * send the link), or the invite row was written but the mail did not go. Each needs different
 * words, because each needs a different action from the person reading it.
 */

export type InviteOutcome = {
  emailed: boolean;
  link: string;
  reason?: 'has_account' | 'send_failed';
};

export type InviteFailureReason =
  | 'not_admin'
  | 'rate_limited'
  | 'not_configured'
  | 'bad_email'
  | 'check_failed'
  | 'unknown';

const INVITE_ERROR_CODES: Record<string, InviteFailureReason> = {
  not_authenticated: 'check_failed',
  not_admin: 'not_admin',
  invite_rate_limited: 'rate_limited',
  not_configured: 'not_configured',
  membership_check_failed: 'check_failed',
  bad_request: 'bad_email',
};

export function inviteFailureReason(code?: string): InviteFailureReason {
  return (code && INVITE_ERROR_CODES[code]) || 'unknown';
}

/** Status is the fallback when the function returns no JSON body at all. */
export function explainInviteFailure(status?: number, code?: string): string {
  switch (inviteFailureReason(code)) {
    case 'not_admin':
      return 'Only owners and admins can invite people.';
    case 'rate_limited':
      return 'Too many invites in the last hour — try again shortly.';
    case 'not_configured':
      return 'Invites are not configured on this project yet.';
    case 'bad_email':
      return 'That email address does not look right.';
    case 'check_failed':
      return 'Could not check your permissions just now — try again.';
    default:
      break;
  }

  if (status === 429) return 'Too many invites in the last hour — try again shortly.';
  if (status === 403) return 'Only owners and admins can invite people.';
  if (status === 401) return 'Your session expired — sign in again to invite.';
  if (status === 501) return 'Invites are not configured on this project yet.';
  return 'Could not create that invite.';
}

/** The sentence shown in the toast after an invite attempt. */
export function describeInviteOutcome(address: string, outcome: InviteOutcome): string {
  if (outcome.emailed) return `Invite emailed to ${address}.`;
  if (outcome.reason === 'has_account') {
    return `${address} already has a Nexora account, so no invite email was sent — their link is on your clipboard.`;
  }
  return `Invite created, but the email did not send — the link is on your clipboard.`;
}
