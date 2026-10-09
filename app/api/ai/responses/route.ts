import { aiModels, openAiKey } from '@/lib/ai';

// Proxy for AG Studio's OpenAI adapter (app/dashboard/studio/openai-adapter.ts). The adapter
// runs in the browser and POSTs to `${endpoint}/responses`; with its endpoint set to /api/ai it lands
// here. This adds the server's OpenAI key (see lib/ai.ts), forwards the body to the OpenAI Responses API and
// streams the SSE reply straight back, so the adapter works unchanged and the key never leaves the
// server.

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

// Bounds the cost of a single turn, whatever the client asks for. Reasoning tokens count towards it.
const MAX_OUTPUT_TOKENS = 32_000;

const error = (status: number, message: string) => Response.json({ error: { message } }, { status });

export async function POST(request: Request) {
  const apiKey = openAiKey();
  if (!apiKey) return error(503, 'The AI assistant is not configured: set AG_STUDIO_OPENAI_API_KEY in .env.local.');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return error(400, 'Request body must be JSON.');
  }

  // Only the models offered in the picker (OPENAI_MODELS) may be called.
  const models = aiModels();
  const model = typeof body.model === 'string' && body.model ? body.model : models[0];
  if (!models.includes(model)) return error(400, `Model "${model}" is not enabled.`);

  const upstream = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...body, model, max_output_tokens: MAX_OUTPUT_TOKENS }),
    // Stopping the chat in Studio aborts the browser request, which cancels this one too.
    signal: request.signal,
  });

  // Errors come back as JSON and the adapter reads `error.message` from them; success is an SSE stream.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
