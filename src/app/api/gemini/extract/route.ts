import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceWithGemini, isGeminiEnabled } from "@/lib/gemini";
import { evaluate3WayMatch } from "@/lib/ml-fallback";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      rawText = "",
      paypalAuthorizedAmount = 0,
      channel3Quote = 0,
    } = body;

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "rawText parameter is required." },
        { status: 400 }
      );
    }

    if (!isGeminiEnabled()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env.local." },
        { status: 503 }
      );
    }

    const extracted = await extractInvoiceWithGemini(rawText);

    // Compute variance against authorized benchmark
    const benchmark = paypalAuthorizedAmount > 0 ? paypalAuthorizedAmount : channel3Quote;
    const variancePct = benchmark > 0
      ? Math.round((Math.abs(extracted.total_amount - benchmark) / benchmark) * 100 * 100) / 100
      : 0;

    const isMatchPassed = variancePct <= 1.5;

    return NextResponse.json({
      status: "success",
      extracted,
      reconciliation: {
        extractedTotal: extracted.total_amount,
        benchmarkAmount: benchmark,
        variancePct,
        thresholdPct: 1.5,
        isMatched: isMatchPassed,
        matchStatus: isMatchPassed ? "MATCHED_OK" : "FROZEN_VARIANCE_EXCEEDED",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
