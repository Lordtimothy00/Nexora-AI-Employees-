// Supabase Edge Function: run-task
//
// The first half of an execution runtime: a human presses "Run" on one task and the employee
// produces the finished deliverable, which is written back as a message in the thread, an entry in
// the activity feed, and a status change to `review` so a person still approves it.
//
// Deliberately synchronous and single-shot. No queue, no cron, no retries — one task in, one
// deliverable out, so the cost and the failure mode stay obvious. Background execution belongs on
// top of this, not inside it.
//
// Who may call it: any member of the workspace that owns the task. The task is read from the
// database, never trusted from the body, and the writes go through the service role.
//
// Request:  { workspaceId, taskId, employee: { name, role, tagline?, deliverables?, skills?, tools? } }
// Response: { deliverable, provider, ms, taskStatus: 'review' }
//           400 bad_request | 401 not_authenticated | 403 not_member | 404 task_not_found
//           429 rate_limited | 501 not_configured | 502 provider_error | 503 workspace_check_failed

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

const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-lite-latest';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
const ANTHROPIC_MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-3-5-haiku-latest';

const PROVIDER_TIMEOUT_MS = 20_000;
const TOTAL_BUDGET_MS = 30_000;
/** A deliverable costs more than a chat line, so this is its own budget rather than a shared one. */
const RUN_LIMIT_PER_HOUR = 20;

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

interface EmployeeSeed {
  name: string;
  role: string;
  tagline?: string;
  deliverables?: string[];
  skills?: string[];
  tools?: string[];
}

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  detail: string | null;
  priority: string | null;
  due: string | null;
  employee_id: string;
}

// PostgREST echoes the failing row back, which can contain the customer's own text.
// Keep only the machine-readable part for the error response.
function writeErrorDetail(text: string) {
  try {
    const parsed = JSON.parse(text) as { code?: string; message?: string };
    return truncate(`${parsed.code ?? ''} ${parsed.message ?? ''}`, 160) || 'insert rejected';
  } catch {
    return 'insert rejected';
  }
}

const truncate = (value: unknown, limit: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, limit) : '';

function systemPrompt(employee: EmployeeSeed) {
  return [
    `You are ${employee.name}, an AI employee working inside a customer's Nexora workspace.`,
    `Your role: ${employee.role}.`,
    employee.tagline ? `How you work: ${employee.tagline}` : '',
    employee.deliverables?.length ? `What you deliver: ${employee.deliverables.join('; ')}.` : '',
    employee.skills?.length ? `Your skills: ${employee.skills.join(', ')}.` : '',
    employee.tools?.length ? `Tools you use: ${employee.tools.join(', ')}.` : '',
    'You are now executing one assigned task end to end. Produce the finished work itself — the email, the brief, the analysis, the plan — not a description of how you would do it.',
    'Open with one short line naming what you produced. Then the deliverable: at most 220 words, plain prose or a short list. No preamble, no "as an AI", no sign-off.',
    'Never invent metrics, customer names, dates, or outcomes you could not know. If the brief is missing something you would need, produce the best version you can from what is there and put the one open question at the very end.',
    'Never state a number about work in progress — quantities, percentages, amounts — unless it appears in the brief.',
  ]
    .filter(Boolean)
    .join('\n');
}

function taskPrompt(task: TaskRow) {
  return [
    `Task: ${task.title}`,
    task.detail ? `Brief: ${task.detail}` : 'Brief: none beyond the title.',
    task.priority ? `Priority: ${task.priority}.` : '',
    task.due ? `Due: ${task.due}.` : '',
    'Write the deliverable now.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function askGemini(key: string, system: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 900 },
      }),
    },
  );

  if (!response.ok) throw new Error(`gemini ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const parts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((part) => !part?.thought && typeof part?.text === 'string')
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

async function askOpenAI(key: string, system: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.6,
      max_tokens: 900,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`openai ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return (data?.choices?.[0]?.message?.content ?? '').toString().trim();
}

async function askAnthropic(key: string, system: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 900,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`anthropic ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return (data?.content?.[0]?.text ?? '').toString().trim();
}

const COOLDOWN_MS = 5 * 60 * 1000;
const cooling = new Map<string, number>();

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!geminiKey && !openaiKey && !anthropicKey) return json({ error: 'not_configured' }, 501);

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const baseUrl = Deno.env.get('SUPABASE_URL');
  if (!serviceKey || !baseUrl) {
    return json({ error: 'not_configured', missing: ['SUPABASE_SERVICE_ROLE_KEY'] }, 501);
  }

  let body: { workspaceId?: unknown; taskId?: unknown; employee?: EmployeeSeed };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request', detail: 'body is not JSON' }, 400);
  }

  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : '';
  const taskId = typeof body.taskId === 'string' ? body.taskId : '';
  const employee = body.employee;

  if (!/^[0-9a-f-]{36}$/i.test(workspaceId) || !/^[0-9a-f-]{36}$/i.test(taskId)) {
    return json({ error: 'bad_request', detail: 'workspaceId/taskId' }, 400);
  }
  if (!employee?.name || !employee?.role) return json({ error: 'bad_request', detail: 'employee' }, 400);

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

  // 1. The caller must belong to the workspace. Fails closed.
  let membership: { role?: string }[] | null = null;
  try {
    const response = await rest(
      `/workspace_members?workspace_id=eq.${workspaceId}&user_id=eq.${userId}&select=role`,
    );
    membership = response.ok ? await response.json() : null;
  } catch {
    membership = null;
  }
  if (!membership) return json({ error: 'workspace_check_failed' }, 503);
  if (membership.length === 0) return json({ error: 'not_member' }, 403);

  // 2. The task is the source of truth — never take its text from the request.
  let task: TaskRow | null = null;
  try {
    const response = await rest(
      `/tasks?id=eq.${taskId}&workspace_id=eq.${workspaceId}` +
        `&select=id,user_id,title,detail,priority,due,employee_id`,
    );
    if (!response.ok) return json({ error: 'workspace_check_failed' }, 503);
    const rows = (await response.json()) as TaskRow[];
    task = rows[0] ?? null;
  } catch {
    return json({ error: 'workspace_check_failed' }, 503);
  }
  if (!task) return json({ error: 'task_not_found' }, 404);

  // 3. One workspace cannot run tasks in a loop all day.
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const response = await rest(
      `/activities?workspace_id=eq.${workspaceId}&kind=eq.delivery&created_at=gte.${since}` +
        `&select=id&limit=${RUN_LIMIT_PER_HOUR + 1}`,
    );
    if (response.ok) {
      const recent = (await response.json()) as { id: string }[];
      if (recent.length > RUN_LIMIT_PER_HOUR) {
        return json({ error: 'rate_limited', limit: RUN_LIMIT_PER_HOUR }, 429);
      }
    }
  } catch {
    /* the count is a courtesy; step 1 is the gate */
  }

  const system = systemPrompt(employee);
  const prompt = taskPrompt(task);

  const attempts = [
    geminiKey ? { provider: 'gemini', key: geminiKey, ask: askGemini } : null,
    openaiKey ? { provider: 'openai', key: openaiKey, ask: askOpenAI } : null,
    anthropicKey ? { provider: 'anthropic', key: anthropicKey, ask: askAnthropic } : null,
  ].filter(
    (attempt): attempt is { provider: string; key: string; ask: typeof askGemini } =>
      attempt !== null,
  );

  const failures: string[] = [];
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (const attempt of attempts) {
    if (Date.now() >= deadline) {
      failures.push('stopped: overall time budget reached');
      break;
    }

    const startedAt = Date.now();
    if ((cooling.get(attempt.provider) ?? 0) > Date.now()) {
      failures.push(`${attempt.provider}: skipped, cooling down after a recent failure`);
      continue;
    }

    try {
      const deliverable = await attempt.ask(attempt.key, system, prompt);
      if (!deliverable) {
        failures.push(`${attempt.provider}: empty deliverable`);
        continue;
      }

      // 4. Write it back: the thread sees the work, the feed records it, the board shows it
      // waiting for a human. A partial write is worse than none, so bail on the first failure.
      const message = await rest('/messages', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: task.user_id,
          employee_id: task.employee_id,
          sender: 'employee',
          body: deliverable,
        }),
      });
      if (!message.ok) {
        return json({ error: 'write_failed', detail: writeErrorDetail(await message.text()) }, 502);
      }

      const activity = await rest('/activities', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          user_id: task.user_id,
          employee_id: task.employee_id,
          kind: 'delivery',
          body: `${employee.name} delivered “${truncate(task.title, 80)}”`,
        }),
      });
      if (!activity.ok) {
        return json({ error: 'write_failed', detail: writeErrorDetail(await activity.text()) }, 502);
      }

      await rest(`/tasks?id=eq.${taskId}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'review' }),
      });

      return json({
        deliverable,
        provider: attempt.provider,
        ms: Date.now() - startedAt,
        taskStatus: 'review',
      });
    } catch (error) {
      const message = `${attempt.provider} (${Date.now() - startedAt}ms) ${String(error)}`;
      failures.push(message.slice(0, 240));
      if (/\b(429|401|403)\b|quota/i.test(message)) {
        cooling.set(attempt.provider, Date.now() + COOLDOWN_MS);
      }
    }
  }

  return json({ error: 'provider_error', detail: failures.join(' | ') }, 502);
});
