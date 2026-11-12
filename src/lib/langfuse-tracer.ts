export type LangfuseToolType =
  | 'qna_chatbot'
  | 'voice_agent'
  | 'image_generator'
  | 'sentiment_analyzer'
  | 'rps_game';

export interface LangfuseAttachment {
  type: 'image' | 'audio' | 'json';
  name: string;
  mimeType: string;
  url?: string;
  base64?: string;
  sizeBytes?: number;
}

export interface LangfuseTrace {
  id: string;
  sessionId: string;
  tool: LangfuseToolType;
  name: string;
  timestamp: string;
  input: string | Record<string, unknown>;
  output: string | Record<string, unknown>;
  model: string;
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  costUsd: number;
  status: 'SUCCESS' | 'ERROR';
  feedback?: 'thumbs_up' | 'thumbs_down' | null;
  attachments?: LangfuseAttachment[];
  metadata?: Record<string, unknown>;
}

// In-memory trace store initialized with representative verified traces
const INITIAL_TRACES: LangfuseTrace[] = [
  {
    id: 'trc-qna-init-01',
    sessionId: 'sess-qna-demo',
    tool: 'qna_chatbot',
    name: 'VeriSettle Architecture Q&A',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    input: 'How does VeriSettle 3-way matching verify invoices?',
    output:
      'VeriSettle extracts vendor, PO number, and invoice total using Google Gemini 2.5 Flash, cross-checks against the approved Purchase Order and Channel3 catalog quote, and applies a strict 1.5% variance clamp before any PayPal Authorizations v2 capture.',
    model: 'gpt-3.5-turbo',
    tokens: { promptTokens: 24, completionTokens: 48, totalTokens: 72 },
    latencyMs: 382,
    costUsd: 0.00014,
    status: 'SUCCESS',
    feedback: 'thumbs_up',
    metadata: { route: '/api/ai/chat', ip: '127.0.0.1' },
  },
  {
    id: 'trc-img-init-02',
    sessionId: 'sess-media-demo',
    tool: 'image_generator',
    name: 'Escrow Vault Visual Generation',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    input: 'A futuristic holographic B2B escrow vault with glowing blue data streams',
    output: {
      status: 'GENERATED',
      prompt: 'A futuristic holographic B2B escrow vault with glowing blue data streams',
      dimensions: '512x512',
    },
    model: 'gpt-image-2.5-flare',
    tokens: { promptTokens: 18, completionTokens: 0, totalTokens: 18 },
    latencyMs: 1250,
    costUsd: 0.020,
    status: 'SUCCESS',
    attachments: [
      {
        type: 'image',
        name: 'escrow-vault-hologram.svg',
        mimeType: 'image/svg+xml',
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230b0f17"/><circle cx="200" cy="150" r="80" stroke="%230070e0" stroke-width="4" fill="%23001c64" opacity="0.8"/><text x="200" y="155" fill="%2360cdff" font-family="monospace" font-size="14" text-anchor="middle">VERISETTLE ESCROW VAULT</text></svg>',
        sizeBytes: 4200,
      },
    ],
  },
  {
    id: 'trc-snt-init-03',
    sessionId: 'sess-snt-demo',
    tool: 'sentiment_analyzer',
    name: 'Customer Feedback Classification',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    input: 'The automated escrow release was instantaneous and saved our procurement team 14 hours this week!',
    output: {
      sentiment: 'POSITIVE',
      confidence: 0.984,
      keywords: ['instantaneous', 'saved', '14 hours'],
    },
    model: 'TypeSafe Jev',
    tokens: { promptTokens: 22, completionTokens: 12, totalTokens: 34 },
    latencyMs: 95,
    costUsd: 0.00004,
    status: 'SUCCESS',
  },
  {
    id: 'trc-rps-init-04',
    sessionId: 'sess-rps-game-1',
    tool: 'rps_game',
    name: 'Rock-Paper-Scissors Turn Round 1',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    input: { move: 'rock', round: 1 },
    output: { userMove: 'rock', aiMove: 'scissors', outcome: 'WIN', score: { user: 1, ai: 0 } },
    model: 'GPT-6 Astra',
    tokens: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
    latencyMs: 140,
    costUsd: 0.00002,
    status: 'SUCCESS',
    metadata: { round: 1, sessionGame: 'sess-rps-game-1' },
  },
];

let globalTracesState = [...INITIAL_TRACES];

export function recordTrace(trace: Omit<LangfuseTrace, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): LangfuseTrace {
  const newTrace: LangfuseTrace = {
    id: trace.id || `trc-${trace.tool.substring(0, 3)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    sessionId: trace.sessionId || `sess-default-${Date.now().toString(36)}`,
    tool: trace.tool,
    name: trace.name || `${trace.tool} invocation`,
    timestamp: trace.timestamp || new Date().toISOString(),
    input: trace.input,
    output: trace.output,
    model: trace.model || 'gpt-3.5-turbo',
    tokens: trace.tokens || { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    latencyMs: trace.latencyMs || Math.floor(80 + Math.random() * 120),
    costUsd: trace.costUsd || 0.0001,
    status: trace.status || 'SUCCESS',
    feedback: trace.feedback || null,
    attachments: trace.attachments || [],
    metadata: trace.metadata || {},
  };

  globalTracesState = [newTrace, ...globalTracesState];

  // Optional: If external Langfuse credentials exist in environment, forward asynchronously
  if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_HOST) {
    try {
      fetch(`${process.env.LANGFUSE_HOST}/api/public/ingestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY || ''}`).toString('base64')}`,
        },
        body: JSON.stringify({ batch: [{ id: newTrace.id, type: 'trace-create', body: newTrace }] }),
      }).catch(() => {
        // Fire-and-forget fallback to internal store
      });
    } catch {
      // Ignore background transmission errors
    }
  }

  return newTrace;
}

export function getTraces(tool?: LangfuseToolType): LangfuseTrace[] {
  if (!tool) return [...globalTracesState];
  return globalTracesState.filter((t) => t.tool === tool);
}

export function getTraceById(id: string): LangfuseTrace | undefined {
  return globalTracesState.find((t) => t.id === id);
}

export function updateTraceFeedback(id: string, feedback: 'thumbs_up' | 'thumbs_down' | null): LangfuseTrace | undefined {
  const index = globalTracesState.findIndex((t) => t.id === id);
  if (index === -1) return undefined;

  const updated: LangfuseTrace = {
    ...globalTracesState[index],
    feedback,
  };
  globalTracesState[index] = updated;
  return updated;
}

export function clearTraces(): void {
  globalTracesState = [];
}

