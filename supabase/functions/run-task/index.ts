// Supabase Edge Function: run-task
//
// One human presses "Run" on one task. The employee produces the finished deliverable, and before it
// is accepted the work is checked against the brief it was given. The deliverable is written back as
// a message in the thread, an entry in the activity feed, a status change to `review`, and a verdict
// on the task row so a person can see what was checked.
//
// The check runs twice over, because either half alone is a story rather than a test:
//
//   1. Deterministic rules — things that are true or false about the text itself: an empty draft, a
//      placeholder, a figure the brief never supplied, quoted wording that was dropped, a list that
//      was asked for and not written, a word ceiling that was blown.
//   2. A second model reads the task and the draft cold and answers one question: does this do what
//      was asked, using only what the brief supports? It is asked to a *different* provider from the
//      one that wrote the draft where possible, so it is not marking its own homework.
//
// If the first draft fails, one repair pass is made with the failures named in the prompt, and the
// better of the two drafts is kept. That is one retry, not a loop: cost stays predictable.
//
// Who may call it: any member of the workspace that owns the task. The task is read from the
// database, never trusted from the body, and the writes go through the service role.
//
// Who may NOT call it: a workspace whose subscription stopped being paid. A deliverable costs model
// tokens, so a lapsed plan pauses its employees until billing is settled. The same rule is enforced
// in Postgres (see the ai_locked triggers), so this check is the friendly message, not the only gate.
//
// Request:  { workspaceId, taskId, employee: { name, role, tagline?, deliverables?, skills?, tools? } }
// Response: { deliverable, provider, ms, taskStatus: 'review', verification }
//           400 bad_request | 401 not_authenticated | 403 not_member | 404 task_not_found
//           402 payment_required | 429 rate_limited | 501 not_configured | 502 provider_error
//           503 workspace_check_failed | 503 billing_check_failed

// Declared here so the checking functions below can be imported and unit-tested outside Deno. The
// declaration is erased at build time; inside an Edge Function the real global is used.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

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

const env = (key: string, fallback = '') => {
  if (typeof Deno === 'undefined') return fallback;
  return Deno.env.get(key) ?? fallback;
};

/** Ceiling for a single provider call, writing or reviewing. */
const CALL_TIMEOUT_MS = 20_000;
const totalBudgetMs = () => 55_000;
/** Time that must remain before a repair pass is worth starting. */
const repairFloorMs = 16_000;
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

const truncate = (value: unknown, limit: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, limit) : '';

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

// ── The brief check ─────────────────────────────────────────────────────────────────────────────
// Pure functions of (task, draft). No network, no database, no model: this is the part that can be
// asserted in a test, so the claim "the output was checked" is backed by something deterministic.

export interface BriefCheck {
  id: string;
  label: string;
  pass: boolean;
  note?: string;
}

export interface ModelVerdict {
  addressesTask: boolean;
  missing: string[];
  reason: string;
}

export type VerificationStatus = 'passes' | 'needs_review' | 'unverified';

export interface Verification {
  status: VerificationStatus;
  checks: BriefCheck[];
  model: ModelVerdict | null;
  attempts: number;
  repaired: boolean;
  checkedAt: string;
}

const normalise = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

const wordCount = (value: string) => (value.trim() ? value.trim().split(/\s+/).length : 0);

/** Currency, percentages, and numbers with a size suffix: figures that carry a unit of their own. */
const UNIT_FIGURE = /(?:[₦$€£]\s?\d[\d,.]*\s?(?:k|m|bn|billion|million|thousand)?|\d[\d,.]*\s?(?:%|percent\b|k\b|m\b|bn\b|million\b|billion\b|thousand\b))/gi;

/** Units of time are ordinary prose ("within 24 hours"), not a claim about the work. */
const TIME_UNIT = /^(hours?|days?|weeks?|months?|years?|minutes?|mins?|seconds?|secs?|times?|business|am|pm)\b/i;

/** "₦1.2 M" and "1.2m" are the same figure; a shared currency is not a different figure. */
const figureKey = (value: string) => normalise(value).replace(/\s+/g, '').replace(/[₦$€£]/g, '');

const digitsOf = (value: string) => value.replace(/\D/g, '');

/**
 * Every figure in the text that reads as a claim: a currency amount, a percentage, a size such as
 * "1.2M", or a bare count such as "47 deals". Years, list numbers and clock units are not claims.
 */
function figuresIn(text: string): string[] {
  const found = new Set<string>();

  for (const match of text.matchAll(UNIT_FIGURE)) found.add(figureKey(match[0]));

  for (const match of text.matchAll(/\d[\d,]*/g)) {
    const value = match[0];
    const start = match.index ?? 0;
    const end = start + value.length;
    if (digitsOf(value).length < 2) continue;

    const before = text.slice(Math.max(0, start - 1), start);
    const after = text.slice(end, end + 12);
    if (/[\d.,]/.test(before)) continue;

    // "1." / "2)" at the start of a line is a list marker.
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const indented = text.slice(lineStart, start).trim() === '';
    if (indented && /^[.)]/.test(after)) continue;

    const numeric = Number(digitsOf(value));
    if (Number.isInteger(numeric) && numeric >= 1900 && numeric <= 2099) continue;
    if (/^[a-z]/i.test(after)) continue; // 12M, 3k, 40th — already counted with their unit, or not a claim
    if (TIME_UNIT.test(after.trim())) continue;

    found.add(figureKey(value));
  }

  return [...found];
}

function quotedPhrases(text: string): string[] {
  const found: string[] = [];
  const pattern = /["“]([^"”]{3,90})["”]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) found.push(match[1].trim());
  return [...new Set(found)].slice(0, 3);
}

const WANTS_LIST = /\b(bullets?|list|steps?|checklist|numbered|bulleted)\b/i;

function askedForWords(brief: string): number | null {
  const match = brief.match(
    /(?:under|fewer than|less than|no more than|maximum(?: of)?|max\.?|in)\s+(\d{2,4})\s+words/i,
  );
  return match ? Number(match[1]) : null;
}

const PLACEHOLDER = /\b(lorem ipsum|as an ai\b|as a language model\b|insert (?:your|the)\b|\btodo\b|\btbd\b)/i;

/** Openers that describe the work instead of doing it. */
const META_REPLY = /^(sure|certainly|of course|absolutely)\b/i;
const META_REPLY_ANYWHERE = /\bas an (ai|assistant|language model)\b|here(?:'s| is) (?:a|an|the) (?:draft|sample|example|template|plan)\b/i;

/**
 * Everything that can be judged about a draft without another model. Each check is named, so a
 * failure reads as a sentence a person can act on rather than a score.
 */
export function checkBrief(
  task: { title: string; detail?: string | null },
  deliverable: string,
): BriefCheck[] {
  const brief = (task.detail ?? '').trim();
  const text = deliverable.trim();
  const words = wordCount(text);
  const normalisedText = normalise(text);
  const sourceFigures = new Set(figuresIn(`${task.title} ${brief}`));
  const checks: BriefCheck[] = [];

  checks.push({
    id: 'produced',
    label: 'Something was actually produced',
    pass: text.length >= 40,
    note: text.length >= 40 ? undefined : 'The draft is empty or too short to be the finished work.',
  });

  const placeholder = text.match(PLACEHOLDER);
  checks.push({
    id: 'no_placeholder',
    label: 'No placeholder or assistant boilerplate',
    pass: !placeholder,
    note: placeholder ? `Contains “${placeholder[0]}”.` : undefined,
  });

  const meta = text.slice(0, 80).match(META_REPLY) ?? text.match(META_REPLY_ANYWHERE);
  checks.push({
    id: 'not_a_meta_reply',
    label: 'The work itself, not a description of how to do it',
    pass: !meta,
    note: meta ? `Opens with “${truncate(meta[0], 40)}”.` : undefined,
  });

  const unsupported = figuresIn(text).filter((figure) => !sourceFigures.has(figure));
  checks.push({
    id: 'figures_from_brief',
    label: 'Every figure comes from the brief',
    pass: unsupported.length === 0,
    note: unsupported.length
      ? `Not in the brief: ${unsupported.map((figure) => `“${figure}”`).join(', ')}.`
      : undefined,
  });

  const phrases = quotedPhrases(brief);
  if (phrases.length > 0) {
    const missing = phrases.filter((phrase) => !normalisedText.includes(normalise(phrase)));
    checks.push({
      id: 'quoted_wording',
      label: 'Wording the brief quoted is used verbatim',
      pass: missing.length === 0,
      note: missing.length
        ? `Missing: ${missing.map((phrase) => `“${truncate(phrase, 60)}”`).join(', ')}.`
        : undefined,
    });
  }

  if (WANTS_LIST.test(brief)) {
    const markers = (text.match(/^[ \t]*(?:[-*•]|\d+[.)])[ \t]+/gm) ?? []).length;
    checks.push({
      id: 'format',
      label: 'The list the brief asked for is there',
      pass: markers >= 2,
      note: markers >= 2 ? undefined : 'The brief asked for a list; the draft has no list items.',
    });
  }

  const limit = askedForWords(brief);
  if (limit !== null) {
    checks.push({
      id: 'word_limit',
      label: `Within the ${limit}-word limit the brief set`,
      pass: words <= Math.ceil(limit * 1.1),
      note: words <= Math.ceil(limit * 1.1) ? undefined : `${words} words.`,
    });
  } else {
    checks.push({
      id: 'length',
      label: 'Short enough to be a deliverable, not an essay',
      pass: words <= 320,
      note: words <= 320 ? undefined : `${words} words against a 220-word target.`,
    });
  }

  return checks;
}

/** Failures, then whatever the reviewer flagged. Lower is better; used to pick between two drafts. */
export function failureScore(verification: { checks: BriefCheck[]; model: ModelVerdict | null }): number {
  const failedChecks = verification.checks.filter((check) => !check.pass).length;
  const missing = verification.model?.missing.length ?? 0;
  const rejected = verification.model && !verification.model.addressesTask ? 1 : 0;
  return failedChecks + missing + rejected;
}

/**
 * A draft only passes when nothing deterministic failed *and* an independent reader agreed. No
 * reader was reachable means the honest answer is "unverified", never "passes".
 */
export function decideStatus(checks: BriefCheck[], model: ModelVerdict | null): VerificationStatus {
  if (checks.some((check) => !check.pass)) return 'needs_review';
  if (!model) return 'unverified';
  return model.addressesTask ? 'passes' : 'needs_review';
}

/** Reads the reviewer's JSON out of whatever wrapping the provider added around it. */
export function parseVerdict(raw: string): ModelVerdict | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const addresses = parsed.addresses_task ?? parsed.addressesTask ?? parsed.addresses_brief;
    if (typeof addresses !== 'boolean') return null;

    const missing = Array.isArray(parsed.missing)
      ? parsed.missing
          .filter((entry): entry is string => typeof entry === 'string')
          .map((entry) => truncate(entry, 120))
          .slice(0, 3)
      : [];

    return { addressesTask: addresses, missing, reason: truncate(parsed.reason, 200) };
  } catch {
    return null;
  }
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
    'Follow the brief exactly: if it quotes wording, use that wording; if it asks for a list, write a list; if it sets a length, keep to it. Your draft is checked against all three before it is accepted.',
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

function verifierSystem(employee: EmployeeSeed) {
  return [
    'You are a reviewer inside a business workspace. You are given a task, the brief that came with it, and a draft an AI employee produced.',
    `The employee is ${employee.name}, ${employee.role}.`,
    'Judge one thing only: does the draft do what the task asked, using only what the brief supports?',
    'Mark addresses_task false when the draft describes what it would do instead of doing it, answers a different question, invents a figure, name, date or outcome the brief never supplied, or leaves out the artefact that was asked for.',
    'List up to three concrete gaps, each under twenty words. Do not rewrite the draft. Do not praise it.',
    'Reply with JSON and nothing else: {"addresses_task": true, "missing": [], "reason": "one sentence"}',
  ].join('\n');
}

function verifierPrompt(task: TaskRow, draft: string) {
  return [
    `Task: ${task.title}`,
    task.detail ? `Brief: ${task.detail}` : 'Brief: none beyond the title.',
    'Draft:',
    '"""',
    truncate(draft, 2600),
    '"""',
  ].join('\n');
}

function repairPrompt(
  task: TaskRow,
  previous: string,
  review: { checks: BriefCheck[]; model: ModelVerdict | null },
) {
  const gaps = [
    ...review.checks
      .filter((check) => !check.pass)
      .map((check) => `- ${check.label}${check.note ? ` (${check.note})` : ''}`),
    ...(review.model?.missing ?? []).map((gap) => `- ${gap}`),
  ].slice(0, 5);

  if (gaps.length === 0 && review.model?.reason) gaps.push(`- ${review.model.reason}`);

  return [
    taskPrompt(task),
    '',
    'Your previous draft is below. It failed these checks:',
    ...gaps,
    '',
    'Rewrite the deliverable so that every one of those is satisfied. Keep what worked. Return only the new deliverable, in the same format.',
    '',
    'Previous draft:',
    truncate(previous, 1800),
  ].join('\n');
}

// ── Providers ───────────────────────────────────────────────────────────────────────────────────

interface AskOptions {
  temperature?: number;
  maxTokens?: number;
}

type Ask = (key: string, system: string, prompt: string, options?: AskOptions) => Promise<string>;

interface Provider {
  provider: string;
  key: string;
  ask: Ask;
}

async function askGemini(key: string, system: string, prompt: string, options: AskOptions = {}) {
  const model = env('GEMINI_MODEL', 'gemini-flash-lite-latest');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.6,
          maxOutputTokens: options.maxTokens ?? 900,
        },
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

async function askOpenAI(key: string, system: string, prompt: string, options: AskOptions = {}) {
  const model = env('OPENAI_MODEL', 'gpt-4o-mini');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? 900,
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

async function askAnthropic(key: string, system: string, prompt: string, options: AskOptions = {}) {
  const model = env('ANTHROPIC_MODEL', 'claude-3-5-haiku-latest');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? 900,
      temperature: options.temperature ?? 0.6,
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

// ── Handler ─────────────────────────────────────────────────────────────────────────────────────

async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const geminiKey = env('GEMINI_API_KEY');
  const openaiKey = env('OPENAI_API_KEY');
  const anthropicKey = env('ANTHROPIC_API_KEY');

  const providers: Provider[] = [
    geminiKey ? { provider: 'gemini', key: geminiKey, ask: askGemini } : null,
    openaiKey ? { provider: 'openai', key: openaiKey, ask: askOpenAI } : null,
    anthropicKey ? { provider: 'anthropic', key: anthropicKey, ask: askAnthropic } : null,
  ].filter((provider): provider is Provider => provider !== null);

  if (providers.length === 0) return json({ error: 'not_configured' }, 501);

  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  const baseUrl = env('SUPABASE_URL');
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

  // 2. A lapsed subscription pauses the team. Fails closed: if the check itself cannot run, no
  // tokens are spent — an unread billing state is not permission to work.
  let locked: unknown = null;
  try {
    const response = await rest('/rpc/workspace_ai_locked', {
      method: 'POST',
      body: JSON.stringify({ p_workspace: workspaceId }),
    });
    locked = response.ok ? await response.json() : null;
  } catch {
    locked = null;
  }
  if (typeof locked !== 'boolean') return json({ error: 'billing_check_failed' }, 503);
  if (locked) {
    return json(
      {
        error: 'payment_required',
        detail:
          'This workspace has an unpaid or cancelled subscription. Update payment in Billing to unlock AI employees.',
      },
      402,
    );
  }

  // 3. The task is the source of truth — never take its text from the request.
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
  const source: TaskRow = task;

  // 4. One workspace cannot run tasks in a loop all day. The count lives in `usage_events`, which
  // only the service role can write: counting rows the workspace owns meant deleting them reset
  // the budget, and the model spend that went with it.
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const response = await rest(
      `/usage_events?workspace_id=eq.${workspaceId}&kind=eq.run&created_at=gte.${since}` +
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

  // Recorded before the model is called, so a run that fails half way still counts against the
  // ceiling. Best effort: an unwritable ledger must not block real work.
  await rest('/usage_events', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ workspace_id: workspaceId, user_id: userId, kind: 'run' }),
  }).catch(() => undefined);

  const system = systemPrompt(employee);
  const prompt = taskPrompt(source);
  const deadline = Date.now() + totalBudgetMs();
  const failures: string[] = [];

  /** Walks the provider chain once, returning the first real answer. */
  const generate = async (input: string) => {
    for (const attempt of providers) {
      if (Date.now() >= deadline) {
        failures.push('stopped: overall time budget reached');
        return null;
      }
      if ((cooling.get(attempt.provider) ?? 0) > Date.now()) {
        failures.push(`${attempt.provider}: skipped, cooling down after a recent failure`);
        continue;
      }
      const attemptStart = Date.now();
      try {
        const text = await attempt.ask(attempt.key, system, input);
        if (!text) {
          failures.push(`${attempt.provider}: empty deliverable`);
          continue;
        }
        return { text, provider: attempt.provider, ms: Date.now() - attemptStart };
      } catch (error) {
        const message = `${attempt.provider} (${Date.now() - attemptStart}ms) ${String(error)}`.slice(0, 240);
        failures.push(message);
        if (/\b(429|401|403)\b|quota/i.test(message)) {
          cooling.set(attempt.provider, Date.now() + COOLDOWN_MS);
        }
      }
    }
    return null;
  };

  /**
   * Rules first, then a reader. The reader is asked of a provider other than the one that wrote the
   * draft where there is a choice, so a model is not the only judge of its own work.
   */
  const review = async (draft: string, author: string) => {
    const checks = checkBrief(source, draft);
    const order = [...providers].sort((a, b) => {
      if (a.provider === author) return 1;
      if (b.provider === author) return -1;
      return 0;
    });

    let model: ModelVerdict | null = null;
    for (const attempt of order) {
      if (Date.now() + 8_000 >= deadline) break;
      if ((cooling.get(attempt.provider) ?? 0) > Date.now()) continue;
      try {
        const raw = await attempt.ask(attempt.key, verifierSystem(employee), verifierPrompt(source, draft), {
          temperature: 0,
          maxTokens: 320,
        });
        model = parseVerdict(raw);
        if (model) break;
      } catch {
        /* an unreachable reviewer lowers the verdict to "unverified"; it never blocks the work */
      }
    }

    return { checks, model };
  };

  const first = await generate(prompt);
  if (!first) return json({ error: 'provider_error', detail: failures.join(' | ') }, 502);

  let chosen = first;
  let verdict = await review(first.text, first.provider);
  let repaired = false;
  let attempts = 1;

  if (decideStatus(verdict.checks, verdict.model) !== 'passes' && Date.now() + repairFloorMs < deadline) {
    const second = await generate(repairPrompt(source, first.text, verdict));
    if (second) {
      attempts = 2;
      const secondVerdict = await review(second.text, second.provider);
      // Keep the better draft, not simply the later one: a repair can make things worse.
      if (failureScore(secondVerdict) <= failureScore(verdict)) {
        chosen = second;
        verdict = secondVerdict;
        repaired = true;
      }
    }
  }

  const status = decideStatus(verdict.checks, verdict.model);
  const verification: Verification = {
    status,
    checks: verdict.checks,
    model: verdict.model,
    attempts,
    repaired,
    checkedAt: new Date().toISOString(),
  };

  // 5. Write it back: the thread sees the work, the feed records it, the board shows it waiting for
  // a human, and the task carries what was checked. A partial write is worse than none, so bail on
  // the first failure.
  const message = await rest('/messages', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      workspace_id: workspaceId,
      user_id: task.user_id,
      employee_id: task.employee_id,
      sender: 'employee',
      body: chosen.text,
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

  const patch = await rest(`/tasks?id=eq.${taskId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: 'review',
      verification,
      verification_status: status,
      verified_at: verification.checkedAt,
    }),
  });

  // The deliverable is already in the thread; a rejected verdict must not lose it. Fall back to the
  // status-only write that has always worked.
  if (!patch.ok) {
    await rest(`/tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'review' }),
    }).catch(() => undefined);
  }

  return json({
    deliverable: chosen.text,
    provider: chosen.provider,
    ms: chosen.ms,
    taskStatus: 'review',
    verification,
  });
}

if (typeof Deno !== 'undefined') Deno.serve(handler);
