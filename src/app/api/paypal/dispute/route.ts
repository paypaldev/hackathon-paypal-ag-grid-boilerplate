import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal-auth";
import { executeDisputeResolution } from "@/lib/paypal-escrow-disputes";
import { evaluateDisputeTriage } from "@/lib/ml-fallback";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "TRIAGE_AND_EXECUTE",
      disputeId = "PP-D-94821",
      orderId = "ORD-2026-X88",
      trackingNumber = "1Z9999999999999999",
      invoiceId = "INV-2026-001",
      disputedAmount = 1850.0,
      baseWinProb = 0.82,
      llmWinProbAdjustment = 0.05,
      strategyOverride,
      offerAmount,
    } = body;

    // 1. Calculate Expected Cost Triage with strict ±0.15 LLM clamp
    const triageResult = evaluateDisputeTriage({
      disputeId,
      orderId,
      trackingNumber,
      invoiceId,
      disputedAmountUsd: parseFloat(String(disputedAmount)),
      baseWinProb: parseFloat(String(baseWinProb)),
      llmWinProbAdjustment: parseFloat(String(llmWinProbAdjustment)),
      partialOfferAmountUsd: offerAmount ? parseFloat(String(offerAmount)) : undefined,
    });

    if (action === "TRIAGE_ONLY") {
      return NextResponse.json({
        action: "TRIAGE_ONLY",
        triage: triageResult,
      });
    }

    // 2. Execute optimal or overridden strategy against PayPal Customer Disputes v1
    const chosenStrategy = (strategyOverride || triageResult.recommendedStrategy) as
      | "MAKE_OFFER"
      | "ACCEPT_CLAIM"
      | "PROVIDE_EVIDENCE";

    const accessToken = await getPayPalAccessToken();

    let payload: Record<string, unknown> = {};
    if (chosenStrategy === "MAKE_OFFER") {
      payload = {
        offer_type: "REFUND",
        offer_amount: {
          currency_code: "USD",
          value: offerAmount ? String(offerAmount) : (disputedAmount * 0.5).toFixed(2),
        },
        note: `Autonomous Settlement Offer based on EV Minimization ($${triageResult.costMakeOfferUsd} expected loss).`,
      };
    } else if (chosenStrategy === "PROVIDE_EVIDENCE") {
      payload = {
        evidence_type: "PROOF_OF_DELIVERY",
        evidence_info: {
          tracking_info: [{ carrier_name: "FEDEX", tracking_number: trackingNumber }],
        },
        notes: triageResult.rebuttalDraftWithCitations,
      };
    } else if (chosenStrategy === "ACCEPT_CLAIM") {
      payload = {
        note: "Claim accepted after automated triage determined defense cost exceeds dispute value.",
      };
    }

    const { data, trace } = await executeDisputeResolution(accessToken, disputeId, chosenStrategy, payload);

    return NextResponse.json({
      action: "TRIAGE_AND_EXECUTE",
      triage: triageResult,
      executedStrategy: chosenStrategy,
      disputeResponse: data,
      trace,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

