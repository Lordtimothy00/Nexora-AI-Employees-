// Supabase Edge Function: invite-member
//
// Creates a workspace invite and emails it. The app used to insert the invite row in the browser
// and hand the admin a link to copy, which meant the "invite" half of inviting was done by the
// admin's clipboard. This function does the sending, through GoTrue's own invite endpoint, so the
// email comes from the same sender as password resets and confirmations — one SMTP setting covers
// all three.
//
// Who may call it: the caller must be the owner or an admin of the workspace in the body. The
// insert is done with the service-role key, so this check is the whole gate — do not soften it.
//
// Request:  { workspaceId, email, role?: 'member' | 'admin', origin }
// Response: { emailed: true, token, link }
//           { emailed: false, token, link, reason: 'has_account' }   // they already have an account
//           400 bad_request | 401 not_authenticated | 403 not_admin
//           429 invite_rate_limited | 501 not_configured
//           502 send_failed { token, link, detail }                  // row exists, email did not go
//
// A 502 still returns the token: the invite is real, and the admin can copy the link by hand.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/** Enough invites to staff a workspace in one sitting; a ceiling so nobody can use us as a mailer. */
const INVITE_LIMIT_PER_HOUR = 20;

const ROLES = new Set(['member', 'admin']);
// Deliberately loose: the real gate is that GoTrue will not deliver to a nonsense address, and a
// stricter pattern here would only reject valid but unusual addresses.
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function userIdFrom(authorization: string | null): string | null {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  const payload = token?.split('.')[1];
  if (!payload) return null;

  try {
    const normalised = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalised));
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

/** The origin the invite link should point at. Anything not http(s) becomes null. */
function safeOrigin(candidate: unknown): string | null {
  if (typeof candidate !== 'string' || !candidate) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

type Row = Record<string, unknown>;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const baseUrl = Deno.env.get('SUPABASE_URL');
  if (!serviceKey || !baseUrl) {
    return json({ error: 'not_configured', missing: ['SUPABASE_SERVICE_ROLE_KEY'] }, 501);
  }

  let body: { workspaceId?: unknown; email?: unknown; role?: unknown; origin?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request', detail: 'body is not JSON' }, 400);
  }

  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body.role === 'string' && ROLES.has(body.role) ? body.role : 'member';
  const origin = safeOrigin(body.origin);

  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) {
    return json({ error: 'bad_request', detail: 'workspaceId' }, 400);
  }
  if (!looksLikeEmail(email)) return json({ error: 'bad_request', detail: 'email' }, 400);

  const userId = userIdFrom(request.headers.get('authorization'));
  if (!userId) return json({ error: 'not_authenticated' }, 401);

  const rest = (path: string, init: RequestInit = {}) =>
    fetch(`${baseUrl}/rest/v1${path}`, {
      ...init,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

  // 1. The caller has to be an owner or admin of this workspace.
  let membership: Row[] | null = null;
  try {
    const response = await rest(
      `/workspace_members?workspace_id=eq.${workspaceId}&user_id=eq.${userId}&select=role`,
    );
    membership = response.ok ? ((await response.json()) as Row[]) : null;
  } catch {
    membership = null;
  }
  // Fails closed: if the check cannot run, no invite and no email.
  if (!membership) return json({ error: 'membership_check_failed' }, 503);

  const callerRole = String(membership[0]?.role ?? '');
  if (!['owner', 'admin'].includes(callerRole)) return json({ error: 'not_admin' }, 403);

  // 2. A workspace cannot be used as an outbound mail relay. Counted from `usage_events`, which
  // only the service role can write — invites are admin-deletable, so counting them let an admin
  // reset the ceiling by removing the row.
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const response = await rest(
      `/usage_events?workspace_id=eq.${workspaceId}&kind=eq.invite&created_at=gte.${since}` +
        `&select=id&limit=${INVITE_LIMIT_PER_HOUR + 1}`,
    );
    if (response.ok) {
      const recent = (await response.json()) as Row[];
      if (recent.length > INVITE_LIMIT_PER_HOUR) {
        return json({ error: 'invite_rate_limited', limit: INVITE_LIMIT_PER_HOUR }, 429);
      }
    }
  } catch {
    /* the count is a courtesy, not a security control — the membership check above is */
  }

  // Recorded before the send, so a failed delivery still counts against the ceiling.
  await rest('/usage_events', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ workspace_id: workspaceId, user_id: userId, kind: 'invite' }),
  }).catch(() => undefined);

  // 3. Reuse a pending invite for the same address so repeated clicks do not pile up rows.
  let token: string | null = null;
  try {
    const response = await rest(
      `/workspace_invites?workspace_id=eq.${workspaceId}&email=eq.${encodeURIComponent(email)}` +
        `&accepted_at=is.null&select=id,token&limit=1`,
    );
    if (response.ok) {
      const existing = (await response.json()) as Row[];
      const found = existing[0];
      if (found?.token) {
        token = String(found.token);
        await rest(`/workspace_invites?id=eq.${found.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ role }),
        });
      }
    }
  } catch {
    token = null;
  }

  // 4. Otherwise create one. `invited_by` defaults to auth.uid(), which is null under the
  // service role, so it is set explicitly.
  if (!token) {
    try {
      const response = await rest('/workspace_invites', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ workspace_id: workspaceId, email, role, invited_by: userId }),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 200);
        return json({ error: 'invite_write_failed', detail }, 502);
      }
      const created = (await response.json()) as Row[];
      token = created[0]?.token ? String(created[0].token) : null;
    } catch (error) {
      return json({ error: 'invite_write_failed', detail: String(error).slice(0, 200) }, 502);
    }
  }

  if (!token) return json({ error: 'invite_write_failed' }, 502);

  const link = `${origin ?? ''}/invite/${token}`;

  // 5. Send it. GoTrue owns the template and the SMTP settings, so this mail looks like the rest
  // of the project's transactional mail.
  const redirectTo = origin ? `${origin}/invite/${token}` : undefined;
  try {
    const response = await fetch(`${baseUrl}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        ...(redirectTo ? { redirect_to: redirectTo } : {}),
        data: { invite_token: token, workspace_id: workspaceId },
      }),
    });

    if (response.ok) return json({ emailed: true, token, link });

    const raw = await response.text();
    const detail = raw.replace(/\s+/g, ' ').slice(0, 200);

    // An address that already has an account cannot be invited twice: they need the link, and
    // the admin needs to know to send it. Say so instead of failing.
    if (/already (been )?registered|already exists/i.test(raw)) {
      return json({ emailed: false, token, link, reason: 'has_account' });
    }

    return json({ error: 'send_failed', token, link, detail }, 502);
  } catch (error) {
    return json({ error: 'send_failed', token, link, detail: String(error).slice(0, 200) }, 502);
  }
});
