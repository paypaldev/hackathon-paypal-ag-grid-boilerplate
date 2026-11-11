import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken, generateRequestId } from "@/lib/paypal-auth";
import { createB2BInvoice } from "@/lib/paypal-escrow-disputes";
import { evaluateEarlyDiscountSkepticGate } from "@/lib/ml-fallback";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "EVALUATE_AND_CREATE",
      invoiceValue = 2500.0,
      pOnTime = 0.92,
      annualCapitalCost = 0.15,
      recipientEmail = "buyer@enterprise-demo.com",
      itemName = "Cloud Hardware Node Alpha",
    } = body;

    // 1. Evaluate Early-Payment Discount "Skeptic Gate"
    const skepticResult = evaluateEarlyDiscountSkepticGate({
      invoiceValueUsd: parseFloat(String(invoiceValue)),
      pOnTimeClient: parseFloat(String(pOnTime)),
      annualCapitalCost: parseFloat(String(annualCapitalCost)),
      discountRate: 0.02,
      accelerationDays: 20,
    });

    if (action === "EVALUATE_ONLY") {
      return NextResponse.json({
        action: "EVALUATE_ONLY",
        skepticGate: skepticResult,
      });
    }

    // 2. Dispatch PayPal Invoicing v2 with or without discount based on Skeptic Gate
    const accessToken = await getPayPalAccessToken();
    const requestId = generateRequestId("inv");

    const effectiveTotal =
      skepticResult.decision === "PROPOSE_DISCOUNT"
        ? (invoiceValue * 0.98).toFixed(2)
        : Number(invoiceValue).toFixed(2);

    const invoicePayload = {
      detail: {
        invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
        currency_code: "USD",
        note:
          skepticResult.decision === "PROPOSE_DISCOUNT"
            ? "Terms: 2/10 Net 30 (Skeptic Gate Approved)"
            : "Terms: Due in 30 Days (Skeptic Gate Preserved Full Margin)",
        payment_term: {
          term_type: skepticResult.decision === "PROPOSE_DISCOUNT" ? "NET_10" : "NET_30",
        },
      },
      primary_recipients: [
        {
          billing_info: {
            email_address: recipientEmail,
          },
        },
      ],
      items: [
        {
          name: itemName,
          quantity: "1",
          unit_amount: { currency_code: "USD", value: effectiveTotal },
        },
      ],
      amount: {
        currency_code: "USD",
        value: effectiveTotal,
      },
    };

    const { data, trace } = await createB2BInvoice(accessToken, invoicePayload, requestId);

    return NextResponse.json({
      action: "EVALUATE_AND_CREATE",
      skepticGate: skepticResult,
      invoice: data,
      trace,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
