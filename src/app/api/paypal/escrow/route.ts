import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken, generateRequestId } from "@/lib/paypal-auth";
import {
  createEscrowAuthorizationOrder,
  settleAuthorizationHold,
  getOrderDetails,
  authorizeOrder,
  getAuthorizationDetails,
  PayPalAuditTrace,
} from "@/lib/paypal-escrow-disputes";
import { evaluatePolicyFirewall, PolicyEvaluationInput } from "@/lib/policy-firewall";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      amountValue = "2450.00",
      currencyCode = "USD",
      customIntentId = `PO-ESCROW-${Date.now().toString(36).toUpperCase()}`,
      orderId,
      authorizationId,
      verifiedCaptureAmount,
      mockErrorHeader,
      category = "Office Equipment",
      layoutlmInvoiceTotalUsd,
      comprehensiveRiskScore,
      promptText,
    } = body;

    const accessToken = await getPayPalAccessToken();
    const requestId = generateRequestId("escrow");

    if (action === "CREATE_AUTHORIZATION") {
      // 1. Evaluate policy firewall before creating escrow authorization
      const policyCheck = evaluatePolicyFirewall({
        recipient: "Enterprise Hardware Supplier LLC",
        category,
        proposedAmountUsd: parseFloat(amountValue),
        layoutlmInvoiceTotalUsd: layoutlmInvoiceTotalUsd ? parseFloat(layoutlmInvoiceTotalUsd) : parseFloat(amountValue),
        paypalAuthorizedAmountUsd: parseFloat(amountValue),
        comprehensiveRiskScore: comprehensiveRiskScore ? parseFloat(comprehensiveRiskScore) : 0.12,
        promptText,
      });

      if (!policyCheck.allowed && policyCheck.status === "BLOCKED_PROMPT_INJECTION") {
        return NextResponse.json(
          {
            error: "Prompt Injection Blocked by Spend Firewall",
            reasons: policyCheck.reasons,
            status: policyCheck.status,
          },
          { status: 403 }
        );
      }

      // 2. Dispatch PayPal Orders v2 with intent: "AUTHORIZE"
      const { data, trace } = await createEscrowAuthorizationOrder(
        accessToken,
        amountValue,
        currencyCode,
        customIntentId,
        requestId,
        mockErrorHeader
      );

      return NextResponse.json({
        success: trace.status < 400,
        action: "CREATE_AUTHORIZATION",
        order: data,
        policy: policyCheck,
        trace,
      });
    }

    if (action === "AUTHORIZE_ORDER") {
      const targetOrderId = orderId || body.id;
      if (!targetOrderId) {
        return NextResponse.json({ error: "orderId is required for AUTHORIZE_ORDER" }, { status: 400 });
      }

      const { data, trace } = await authorizeOrder(accessToken, targetOrderId, requestId);
      return NextResponse.json({
        success: trace.status < 400,
        action: "AUTHORIZE_ORDER",
        orderId: targetOrderId,
        result: data,
        trace,
      });
    }

    if (action === "GET_ORDER") {
      const targetOrderId = orderId || body.id;
      if (!targetOrderId) {
        return NextResponse.json({ error: "orderId is required for GET_ORDER" }, { status: 400 });
      }

      const { data, trace } = await getOrderDetails(accessToken, targetOrderId);
      return NextResponse.json({
        success: trace.status < 400,
        action: "GET_ORDER",
        orderId: targetOrderId,
        order: data,
        trace,
      });
    }

    if (action === "GET_AUTHORIZATION") {
      const targetAuthId = authorizationId || body.id;
      if (!targetAuthId) {
        return NextResponse.json({ error: "authorizationId is required for GET_AUTHORIZATION" }, { status: 400 });
      }

      const { data, trace } = await getAuthorizationDetails(accessToken, targetAuthId);
      return NextResponse.json({
        success: trace.status < 400,
        action: "GET_AUTHORIZATION",
        authorizationId: targetAuthId,
        authorization: data,
        trace,
      });
    }

    if (action === "CAPTURE" || action === "VOID") {
      if (!authorizationId) {
        return NextResponse.json({ error: "authorizationId is required for CAPTURE or VOID" }, { status: 400 });
      }

      const captureAmt = verifiedCaptureAmount || amountValue;

      // Deterministic policy evaluation for settlement
      const policyCheck = evaluatePolicyFirewall({
        recipient: "Enterprise Hardware Supplier LLC",
        category,
        proposedAmountUsd: parseFloat(amountValue),
        verifiedDeliveredAmountUsd: parseFloat(captureAmt),
        layoutlmInvoiceTotalUsd: layoutlmInvoiceTotalUsd ? parseFloat(layoutlmInvoiceTotalUsd) : parseFloat(captureAmt),
        paypalAuthorizedAmountUsd: parseFloat(amountValue),
        comprehensiveRiskScore: comprehensiveRiskScore ? parseFloat(comprehensiveRiskScore) : 0.12,
        promptText,
      });

      if (action === "CAPTURE" && !policyCheck.allowed) {
        return NextResponse.json(
          {
            error: "Settlement Blocked by Policy Firewall",
            reasons: policyCheck.reasons,
            status: policyCheck.status,
            policy: policyCheck,
          },
          { status: 422 }
        );
      }

      // Settle hold via PayPal Authorizations v2
      const effectiveCaptureAmount = policyCheck.allowedCaptureAmountUsd.toFixed(2);
      const { data, trace } = await settleAuthorizationHold(
        accessToken,
        authorizationId,
        action,
        effectiveCaptureAmount,
        currencyCode,
        requestId
      );

      return NextResponse.json({
        success: trace.status < 400,
        action,
        settlement: data,
        policy: policyCheck,
        effectiveCaptureAmount,
        trace,
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

