import { NextResponse } from 'next/server';
import { recordTrace, type LangfuseAttachment } from '@/lib/langfuse-tracer';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const prompt = (body.prompt || 'Hello, I need to check the status of my escrow release.').trim();
    const storeAudio = Boolean(body.storeAudio);
    const sessionId = body.sessionId || `sess-voice-${Date.now().toString(36)}`;

    // Voice conversation simulation (LiveKit / GPT-Live full-duplex agent)
    const transcript =
      'Voice agent connected. Your escrow milestone for PO-ESCROW-2026-X88 is currently locked at 70% delivery confirmation. $1,715.00 USD has been authorized for settlement with PayPal-Debug-Id active.';

    const latencyMs = Date.now() - startTime + 80;
    const promptTokens = Math.max(12, Math.ceil(prompt.length / 4));
    const completionTokens = Math.max(25, Math.ceil(transcript.length / 4));
    const totalTokens = promptTokens + completionTokens;
    const costUsd = Number(((promptTokens * 0.000002) + (completionTokens * 0.000003)).toFixed(6));

    const attachments: LangfuseAttachment[] = [];
    if (storeAudio) {
      attachments.push({
        type: 'audio',
        name: `voice-turn-${Date.now()}.wav`,
        mimeType: 'audio/wav',
        url: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=', // Minimal valid WAV RIFF header
        sizeBytes: 24576,
      });
    }

    const trace = recordTrace({
      sessionId,
      tool: 'voice_agent',
      name: 'Voice Agent Full-Duplex Turn',
      input: { prompt, speechDurationSec: 3.4 },
      output: { transcript, audioPlaybackSec: 4.8 },
      model: 'GPT-Live (LiveKit Agents)',
      tokens: { promptTokens, completionTokens, totalTokens },
      latencyMs,
      costUsd,
      status: 'SUCCESS',
      attachments,
      metadata: { storeAudio, protocol: 'WebRTC / LiveKit OTel' },
    });

    return NextResponse.json({
      transcript,
      storeAudio,
      traceId: trace.id,
      sessionId,
      attachmentsCount: attachments.length,
      latencyMs,
      costUsd,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Voice session error' }, { status: 500 });
  }
}

