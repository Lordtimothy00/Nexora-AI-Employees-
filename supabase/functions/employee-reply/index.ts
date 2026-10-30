// Supabase Edge Function: employee-reply
//
// Gives the AI employees a real voice. The browser sends the employee's persona, the last few
// turns of the thread and the new message; this function asks the configured model for the reply.
//
// Configure one (or more) secrets on the project (Settings -> Edge Functions -> Secrets):
//   GEMINI_API_KEY      -> uses gemini-flash-lite-latest, Google's free tier covers a demo
//   OPENAI_API_KEY      -> uses gpt-4o-mini
//   ANTHROPIC_API_KEY   -> uses claude-3-5-haiku-latest
//
// Providers are tried in that order (cheapest first for a demo), and one that recently
// refused on quota or auth is skipped for a few minutes so a dead account does not add a
// failed round trip to every reply. With none set, the function answers 501 and the app
// falls back to its scripted replies.
//
// Model names move under you: gemini-2.5-flash was retired for new keys mid-build. Override
// any of them with GEMINI_MODEL / OPENAI_MODEL / ANTHROPIC_MODEL instead of redeploying.

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

// The -latest aliases track whatever Google ships next, which survives the model
// retirements that broke the first attempt at this integration.
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-lite-latest';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
const ANTHROPIC_MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-3-5-haiku-latest';

// A provider that stops answering must not hold the whole reply hostage: cap each attempt so
// the next provider gets a turn and the caller hears back inside a chat-sized pause.
const PROVIDER_TIMEOUT_MS = 12_000;

type Turn = { from: 'human' | 'employee'; text: string };

interface EmployeeSeed {
  name: string;
  role: string;
  tagline?: string;
  deliverables?: string[];
  skills?: string[];
  tools?: string[];
}

interface Body {
  employee: EmployeeSeed;
  history?: Turn[];
  message: string;
}

function systemPrompt(employee: EmployeeSeed) {
  return [
    `You are ${employee.name}, an AI employee working inside a customer's Nexora workspace.`,
    `Your role: ${employee.role}.`,
    employee.tagline ? `How you work: ${employee.tagline}` : '',
    employee.deliverables?.length ? `What you deliver: ${employee.deliverables.join('; ')}.` : '',
    employee.skills?.length ? `Your skills: ${employee.skills.join(', ')}.` : '',
    employee.tools?.length ? `Tools you use: ${employee.tools.join(', ')}.` : '',
    'Write like a capable colleague in a chat: plain sentences, two to four of them, no headings, no bullet lists unless you are explicitly asked for a list.',
    'Be concrete. If you need a decision from the human, end with one clear question.',
    'Never invent metrics, customer names, or outcomes you could not know. If you do not have the data, say what you would need.',
    'Never quote a number about work in progress — quantities, percentages, amounts, dates — unless the human wrote it in this thread. Say "the batch", "the list" or "this week" instead of inventing a count.',
  ]
    .filter(Boolean)
    .join('\n');
}

function turns(history: Turn[] | undefined) {
  return (history ?? [])
    .slice(-8)
    .filter((turn) => turn && typeof turn.text === 'string' && turn.text.trim().length > 0);
}

async function askOpenAI(key: string, body: Body): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      max_tokens: 320,
      messages: [
        { role: 'system', content: systemPrompt(body.employee) },
        ...turns(body.history).map((turn) => ({
          role: turn.from === 'human' ? 'user' : 'assistant',
          content: turn.text,
        })),
        { role: 'user', content: body.message },
      ],
    }),
  });

  if (!response.ok) throw new Error(`openai ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return (data?.choices?.[0]?.message?.content ?? '').toString().trim();
}

async function askAnthropic(key: string, body: Body): Promise<string> {
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
      max_tokens: 320,
      system: systemPrompt(body.employee),
      messages: [
        ...turns(body.history).map((turn) => ({
          role: turn.from === 'human' ? 'user' : 'assistant',
          content: turn.text,
        })),
        { role: 'user', content: body.message },
      ],
    }),
  });

  if (!response.ok) throw new Error(`anthropic ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return (data?.content?.[0]?.text ?? '').toString().trim();
}

async function askGemini(key: string, body: Body): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(body.employee) }] },
        contents: [
          ...turns(body.history).map((turn) => ({
            role: turn.from === 'human' ? 'user' : 'model',
            parts: [{ text: turn.text }],
          })),
          { role: 'user', parts: [{ text: body.message }] },
        ],
        // No thinkingConfig: the lite models reject it with 400 INVALID_ARGUMENT, and a
        // chat reply does not need a reasoning budget.
        generationConfig: { temperature: 0.7, maxOutputTokens: 320 },
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

// Best effort across the lifetime of an isolate: a provider that just ran out of credit
// should not add a failed round trip to every reply.
const COOLDOWN_MS = 5 * 60 * 1000;
const cooling = new Map<string, number>();

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!geminiKey && !openaiKey && !anthropicKey) return json({ error: 'not_configured' }, 501);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  if (!body?.message?.trim() || !body?.employee?.name) return json({ error: 'bad_request' }, 400);

  // Try every configured provider, not just the first one. An account with no credits
  // left is a billing problem, not a code problem, and the other provider may be fine.
  const attempts = [
    geminiKey ? { provider: 'gemini', key: geminiKey, ask: askGemini } : null,
    openaiKey ? { provider: 'openai', key: openaiKey, ask: askOpenAI } : null,
    anthropicKey ? { provider: 'anthropic', key: anthropicKey, ask: askAnthropic } : null,
  ].filter((attempt): attempt is { provider: string; key: string; ask: typeof askOpenAI } =>
    attempt !== null,
  );

  const failures: string[] = [];
  for (const attempt of attempts) {
    const startedAt = Date.now();
    if ((cooling.get(attempt.provider) ?? 0) > Date.now()) {
      failures.push(`${attempt.provider}: skipped, cooling down after a recent failure`);
      continue;
    }

    try {
      const reply = await attempt.ask(attempt.key, body);
      if (reply) return json({ reply, provider: attempt.provider, ms: Date.now() - startedAt });
      failures.push(`${attempt.provider}: empty reply`);
    } catch (error) {
      const message = `${attempt.provider} (${Date.now() - startedAt}ms) ${String(error)}`;
      failures.push(message.slice(0, 240));
      // 429/401/403 mean the account, not the request, is the problem.
      if (/\b(429|401|403)\b|quota/i.test(message)) {
        cooling.set(attempt.provider, Date.now() + COOLDOWN_MS);
      }
    }
  }

  return json({ error: 'provider_error', detail: failures.join(' | ') }, 502);
});
