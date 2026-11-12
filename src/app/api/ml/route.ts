import { NextRequest, NextResponse } from "next/server";
import {
  checkMlServiceHealth,
  extractDocumentMl,
  scoreTransactionRiskMl,
  evaluateEconomicsMl,
} from "@/lib/ml-service-client";

export async function GET() {
  const health = await checkMlServiceHealth();
  return NextResponse.json(health);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "EXTRACT_DOCUMENT") {
      const { rawText, paypalAuthorizedAmount = 0, channel3PoQuote = 0 } = body;
      if (!rawText) {
        return NextResponse.json({ error: "rawText is required for EXTRACT_DOCUMENT" }, { status: 400 });
      }
      const res = await extractDocumentMl(rawText, paypalAuthorizedAmount, channel3PoQuote);
      return NextResponse.json({ status: "success", ...res });
    }

    if (action === "SCORE_TRANSACTION") {
      const { amount = 2450.0, category = "Office Equipment", unitPrice = 110.0 } = body;
      const res = await scoreTransactionRiskMl({
        amount,
        category,
        unitPrice,
        channel3CategoryMean: body.channel3CategoryMean,
        channel3CategoryStd: body.channel3CategoryStd,
      });
      return NextResponse.json({ status: "success", ...res });
    }

    if (action === "EVALUATE_ECONOMICS") {
      const { useCase = "INVOICE_DISCOUNT_GATE", ...params } = body;
      const res = await evaluateEconomicsMl({
        useCase,
        ...params,
      });
      return NextResponse.json({ status: "success", ...res });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

