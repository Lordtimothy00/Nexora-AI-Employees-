// Supabase Edge Function: employee-reply
//
// Gives the AI employees a real voice. The browser sends the employee's persona, the last few
// turns of the thread and the new message; this function asks the configured model for the reply.
//
// Configure one secret on the project (Settings → Edge Functions → Secrets):
//   OPENAI_API_KEY      → uses gpt-4o-mini
//   ANTHROPIC_API_KEY   → uses claude-3-5-haiku-latest
//
// With neither set, the function answers 501 and the app falls back to its scripted replies.

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
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
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
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!openaiKey && !anthropicKey) return json({ error: 'not_configured' }, 501);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  if (!body?.message?.trim() || !body?.employee?.name) return json({ error: 'bad_request' }, 400);

  try {
    const reply = openaiKey ? await askOpenAI(openaiKey, body) : await askAnthropic(anthropicKey as string, body);
    if (!reply) return json({ error: 'empty_reply' }, 502);
    return json({ reply, provider: openaiKey ? 'openai' : 'anthropic' });
  } catch (error) {
    return json({ error: 'provider_error', detail: String(error) }, 502);
  }
});
