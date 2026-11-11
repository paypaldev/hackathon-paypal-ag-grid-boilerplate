import { NextRequest, NextResponse } from "next/server";
import { generateDisputeRebuttalWithGemini, isGeminiEnabled } from "@/lib/gemini";
import { evaluateDisputeTriage } from "@/lib/ml-fallback";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      disputeId = "PP-D-84920",
      orderId = "ORD-2026-X88",
      trackingNumber = "1Z9999999999999999",
      invoiceId = "INV-2026-001",
      disputedAmountUsd = 1850.0,
      baseWinProb = 0.85,
      llmWinProbAdjustment = 0.05,
    } = body;

    // First compute deterministic economic cost
    const triage = evaluateDisputeTriage({
      disputeId,
      orderId,
      trackingNumber,
      invoiceId,
      disputedAmountUsd,
      baseWinProb,
      llmWinProbAdjustment,
    });

    let liveGeminiRebuttal: string | undefined;
    let modelUsed: string = "deterministic-fallback";

    if (isGeminiEnabled()) {
      const geminiResult = await generateDisputeRebuttalWithGemini({
        disputeId,
        orderId,
        trackingNumber,
        invoiceId,
        disputedAmountUsd,
        calibratedWinProb: triage.calibratedWinProb,
        recommendedStrategy: triage.recommendedStrategy,
      });
      liveGeminiRebuttal = geminiResult.rebuttalText;
      modelUsed = geminiResult.modelUsed;
    }

    return NextResponse.json({
      status: "success",
      triage,
      geminiRebuttal: liveGeminiRebuttal || triage.rebuttalDraftWithCitations,
      modelUsed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
