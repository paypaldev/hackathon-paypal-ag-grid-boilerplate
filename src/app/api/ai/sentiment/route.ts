import { NextResponse } from 'next/server';
import { recordTrace } from '@/lib/langfuse-tracer';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const text = (body.text || '').trim();
    const sessionId = body.sessionId || `sess-snt-${Date.now().toString(36)}`;

    if (!text) {
      return NextResponse.json({ error: 'Text is required for analysis' }, { status: 400 });
    }

    const tLower = text.toLowerCase();

    // TypeSafe Jev Sentiment Classification Heuristics
    const positiveWords = ['instantaneous', 'saved', 'exceeded', 'delighted', 'great', 'excellent', 'smooth', 'fast', 'helpful', 'success', 'approved', 'perfect', '14 hours'];
    const negativeWords = ['surprise', 'surcharge', 'late', 'delay', 'failed', 'fraud', 'overbilled', 'terrible', 'worst', 'unacceptable', 'dispute', 'chargeback', 'error'];

    let posScore = 0;
    let negScore = 0;
    const foundKeywords: string[] = [];

    positiveWords.forEach((word) => {
      if (tLower.includes(word)) {
        posScore += 1;
        foundKeywords.push(word);
      }
    });

    negativeWords.forEach((word) => {
      if (tLower.includes(word)) {
        negScore += 1;
        foundKeywords.push(word);
      }
    });

    let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 0.85;

    if (posScore > negScore) {
      sentiment = 'POSITIVE';
      confidence = Math.min(0.99, 0.85 + posScore * 0.05);
    } else if (negScore > posScore) {
      sentiment = 'NEGATIVE';
      confidence = Math.min(0.99, 0.85 + negScore * 0.05);
    } else {
      sentiment = 'NEUTRAL';
      confidence = 0.90;
    }

    const latencyMs = Date.now() - startTime + 25;
    const promptTokens = Math.max(8, Math.ceil(text.length / 4));
    const completionTokens = 12;
    const totalTokens = promptTokens + completionTokens;
    const costUsd = Number(((promptTokens * 0.000001) + (completionTokens * 0.000002)).toFixed(6));

    const resultPayload = {
      sentiment,
      confidence: Number(confidence.toFixed(3)),
      keywords: foundKeywords.slice(0, 5),
    };

    const trace = recordTrace({
      sessionId,
      tool: 'sentiment_analyzer',
      name: 'Customer Feedback Sentiment Triage',
      input: text,
      output: resultPayload,
      model: 'TypeSafe Jev',
      tokens: { promptTokens, completionTokens, totalTokens },
      latencyMs,
      costUsd,
      status: 'SUCCESS',
      metadata: { textLength: text.length },
    });

    return NextResponse.json({
      text,
      sentiment,
      confidence: Number(confidence.toFixed(3)),
      keywords: foundKeywords,
      traceId: trace.id,
      sessionId,
      latencyMs,
      costUsd,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Sentiment analysis failed' }, { status: 500 });
  }
}

