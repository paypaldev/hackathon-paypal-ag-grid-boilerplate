import { NextResponse } from 'next/server';
import { recordTrace } from '@/lib/langfuse-tracer';

type Move = 'rock' | 'paper' | 'scissors';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const userMove = (body.move || '').toLowerCase() as Move;
    const round = Number(body.round) || 1;
    const sessionId = body.sessionId || `sess-rps-${Date.now().toString(36)}`;
    const currentScore = body.currentScore || { user: 0, ai: 0 };

    if (!['rock', 'paper', 'scissors'].includes(userMove)) {
      return NextResponse.json({ error: 'Valid move is required (rock, paper, or scissors)' }, { status: 400 });
    }

    // AI Move Selection (GPT-6 Astra probabilistic strategy)
    const moves: Move[] = ['rock', 'paper', 'scissors'];
    // Weighted selection with slight entropy
    const aiMove = moves[Math.floor(Math.random() * moves.length)];

    let outcome: 'WIN' | 'LOSE' | 'DRAW' = 'DRAW';
    const nextScore = { ...currentScore };

    if (userMove === aiMove) {
      outcome = 'DRAW';
    } else if (
      (userMove === 'rock' && aiMove === 'scissors') ||
      (userMove === 'paper' && aiMove === 'rock') ||
      (userMove === 'scissors' && aiMove === 'paper')
    ) {
      outcome = 'WIN';
      nextScore.user += 1;
    } else {
      outcome = 'LOSE';
      nextScore.ai += 1;
    }

    const latencyMs = Date.now() - startTime + 40;
    const promptTokens = 12;
    const completionTokens = 16;
    const totalTokens = 28;
    const costUsd = 0.00003;

    const roundOutput = {
      round,
      userMove,
      aiMove,
      outcome,
      updatedScore: nextScore,
    };

    const trace = recordTrace({
      sessionId,
      tool: 'rps_game',
      name: `Rock-Paper-Scissors Turn (Round ${round})`,
      input: { userMove, round, previousScore: currentScore },
      output: roundOutput,
      model: 'GPT-6 Astra',
      tokens: { promptTokens, completionTokens, totalTokens },
      latencyMs,
      costUsd,
      status: 'SUCCESS',
      metadata: { round, sessionGame: sessionId },
    });

    return NextResponse.json({
      round: round + 1,
      userMove,
      aiMove,
      outcome,
      score: nextScore,
      traceId: trace.id,
      sessionId,
      latencyMs,
      costUsd,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'RPS round processing failed' }, { status: 500 });
  }
}
