import "server-only";

/**
 * VeriSettle AI — Core PayPal Sandbox Execution Engine
 * Covers:
 *  1. Orders v2 Escrow Authorization (intent: "AUTHORIZE") with PayPal-Mock-Response chaos support
 *  2. Authorizations v2 Conditional Settlement (/capture with final_capture: true or /void)
 *  3. Invoicing v2 B2B Invoice Generation with dynamic early-payment discount structure
 *  4. Customer Disputes v1 Autonomous Triage (/make-offer, /accept-claim, /provide-evidence)
 *
 * Every operation yields a structured PayPalAuditTrace with PayPal-Debug-Id and precise latency.
 */

export const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

export interface PayPalAuditTrace {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  paypalDebugId: string | null;
  latencyMs: number;
  requestId: string;
  simulated?: boolean;
}

export interface EscrowOrderResponse {
  id: string;
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
  intent: "AUTHORIZE";
  links?: Array<{ href: string; rel: string; method: string }>;
  purchase_units?: Array<{
    reference_id?: string;
    amount: { currency_code: string; value: string };
    payments?: {
      authorizations?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
}

// 1. Create Milestone Escrow Hold via Orders v2 (intent: "AUTHORIZE")
export async function createEscrowAuthorizationOrder(
  accessToken: string,
  amountValue: string,
  currencyCode: string = "USD",
  customIntentId: string,
  requestId: string,
  mockErrorHeader?: string
): Promise<{ data: EscrowOrderResponse | Record<string, unknown>; trace: PayPalAuditTrace }> {
  const start = performance.now();
  const isSimulated = accessToken.startsWith("simulated_");

  // Chaos testing or offline simulation
  if (isSimulated) {
    const latency = Math.round(performance.now() - start + 24);
    if (mockErrorHeader === "INSTRUMENT_DECLINED") {
      const trace: PayPalAuditTrace = {
        timestamp: new Date().toISOString(),
        method: "POST",
        path: "/v2/checkout/orders",
        status: 400,
        paypalDebugId: `SIMULATED-ERR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        latencyMs: latency,
        requestId,
        simulated: true,
      };
      return {
        data: {
          name: "UNPROCESSABLE_ENTITY",
          message: "The requested action could not be completed due to payment instrument decline.",
          debug_id: trace.paypalDebugId,
          details: [{ issue: "INSTRUMENT_DECLINED", description: "Simulated PayPal-Mock-Response rejection." }],
        },
        trace,
      };
    }

    const orderId = `SIM-ORD-${Date.now().toString(36).toUpperCase()}`;
    const authId = `SIM-AUTH-${Date.now().toString(36).toUpperCase()}`;
    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path: "/v2/checkout/orders",
      status: 201,
      paypalDebugId: `SIMULATED-DBG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      latencyMs: latency,
      requestId,
      simulated: true,
    };
    return {
      data: {
        id: orderId,
        status: "CREATED",
        intent: "AUTHORIZE",
        purchase_units: [
          {
            amount: { currency_code: currencyCode, value: amountValue },
            payments: {
              authorizations: [
                {
                  id: authId,
                  status: "CREATED",
                  amount: { currency_code: currencyCode, value: amountValue },
                },
              ],
            },
          },
        ],
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
            rel: "approve",
            method: "GET",
          },
        ],
      },
      trace,
    };
  }

  // Live PayPal Sandbox API Call
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
    "PayPal-Request-Id": requestId,
    "Prefer": "return=representation",
  };

  if (mockErrorHeader) {
    headers["PayPal-Mock-Response"] = JSON.stringify({ mock_application_codes: mockErrorHeader });
  }

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        intent: "AUTHORIZE",
        purchase_units: [
          {
            custom_id: customIntentId,
            description: "VeriSettle AI Evidence-Gated Milestone Escrow",
            amount: { currency_code: currencyCode, value: amountValue },
          },
        ],
      }),
    });

    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path: "/v2/checkout/orders",
      status: res.status,
      paypalDebugId: res.headers.get("paypal-debug-id"),
      latencyMs: Math.round(performance.now() - start),
      requestId,
      simulated: false,
    };

    const data = await res.json();
    return { data, trace };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - start);
    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path: "/v2/checkout/orders",
      status: 500,
      paypalDebugId: null,
      latencyMs: latency,
      requestId,
      simulated: false,
    };
    return {
      data: { error: err instanceof Error ? err.message : String(err) },
      trace,
    };
  }
}

// 2. Execute Conditional Escrow Settlement (Capture Verified Amount or Void Hold)
export async function settleAuthorizationHold(
  accessToken: string,
  authorizationId: string,
  action: "CAPTURE" | "VOID",
  verifiedCaptureAmount: string,
  currencyCode: string = "USD",
  requestId: string
): Promise<{ data: Record<string, unknown>; trace: PayPalAuditTrace }> {
  const start = performance.now();
  const isSimulated = accessToken.startsWith("simulated_") || authorizationId.startsWith("SIM-");

  if (isSimulated) {
    const latency = Math.round(performance.now() - start + 18);
    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path: action === "VOID" ? `/v2/payments/authorizations/${authorizationId}/void` : `/v2/payments/authorizations/${authorizationId}/capture`,
      status: action === "VOID" ? 204 : 201,
      paypalDebugId: `SIMULATED-SETTLE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      latencyMs: latency,
      requestId,
      simulated: true,
    };
    return {
      data: action === "VOID"
        ? { status: "VOIDED", id: authorizationId }
        : {
            id: `SIM-CAP-${Date.now().toString(36).toUpperCase()}`,
            status: "COMPLETED",
            amount: { currency_code: currencyCode, value: verifiedCaptureAmount },
            final_capture: true,
          },
      trace,
    };
  }

  const path =
    action === "VOID"
      ? `/v2/payments/authorizations/${authorizationId}/void`
      : `/v2/payments/authorizations/${authorizationId}/capture`;

  const bodyPayload =
    action === "VOID"
      ? undefined
      : JSON.stringify({
          amount: { currency_code: currencyCode, value: verifiedCaptureAmount },
          final_capture: true,
          note_to_payer: "Released after 3-Way Match (LayoutLMv3 + Channel3 + PayPal Order)",
        });

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "PayPal-Request-Id": requestId,
      },
      body: bodyPayload,
    });

    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path,
      status: res.status,
      paypalDebugId: res.headers.get("paypal-debug-id"),
      latencyMs: Math.round(performance.now() - start),
      requestId,
      simulated: false,
    };

    const data = res.status === 204 ? { status: "VOIDED" } : await res.json();
    return { data, trace };
  } catch (err: unknown) {
    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path,
      status: 500,
      paypalDebugId: null,
      latencyMs: Math.round(performance.now() - start),
      requestId,
      simulated: false,
    };
    return { data: { error: err instanceof Error ? err.message : String(err) }, trace };
  }
}

// 3. Invoicing v2 B2B Invoice Dispatch
export async function createB2BInvoice(
  accessToken: string,
  invoiceData: Record<string, unknown>,
  requestId: string
): Promise<{ data: Record<string, unknown>; trace: PayPalAuditTrace }> {
  const start = performance.now();
  const isSimulated = accessToken.startsWith("simulated_");

  if (isSimulated) {
    const invId = `SIM-INV-${Date.now().toString(36).toUpperCase()}`;
    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path: "/v2/invoicing/invoices",
      status: 201,
      paypalDebugId: `SIMULATED-INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      latencyMs: Math.round(performance.now() - start + 20),
      requestId,
      simulated: true,
    };
    return {
      data: {
        id: invId,
        status: "DRAFT",
        detail: invoiceData.detail || { invoice_number: "INV-2026-001" },
        amount: invoiceData.amount || { currency_code: "USD", value: "2450.00" },
      },
      trace,
    };
  }

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "PayPal-Request-Id": requestId,
      },
      body: JSON.stringify(invoiceData),
    });

    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path: "/v2/invoicing/invoices",
      status: res.status,
      paypalDebugId: res.headers.get("paypal-debug-id"),
      latencyMs: Math.round(performance.now() - start),
      requestId,
      simulated: false,
    };

    const data = await res.json();
    return { data, trace };
  } catch (err: unknown) {
    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path: "/v2/invoicing/invoices",
      status: 500,
      paypalDebugId: null,
      latencyMs: Math.round(performance.now() - start),
      requestId,
      simulated: false,
    };
    return { data: { error: err instanceof Error ? err.message : String(err) }, trace };
  }
}

// 4. Autonomous Dispute Triage Action (Disputes v1: Make Offer, Accept Claim, Provide Evidence)
export async function executeDisputeResolution(
  accessToken: string,
  disputeId: string,
  strategy: "MAKE_OFFER" | "ACCEPT_CLAIM" | "PROVIDE_EVIDENCE",
  payload: Record<string, unknown>,
  requestId: string = `dispute-${disputeId}-${strategy.toLowerCase()}`
): Promise<{ data: Record<string, unknown>; trace: PayPalAuditTrace }> {
  const start = performance.now();
  const isSimulated = accessToken.startsWith("simulated_") || disputeId.startsWith("SIM-");

  let endpointSuffix = "make-offer";
  if (strategy === "ACCEPT_CLAIM") endpointSuffix = "accept-claim";
  if (strategy === "PROVIDE_EVIDENCE") endpointSuffix = "provide-evidence";

  const path = `/v1/customer/disputes/${disputeId}/${endpointSuffix}`;

  if (isSimulated) {
    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path,
      status: 200,
      paypalDebugId: `SIMULATED-DISPUTE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      latencyMs: Math.round(performance.now() - start + 15),
      requestId,
      simulated: true,
    };
    return {
      data: {
        dispute_id: disputeId,
        status: strategy === "ACCEPT_CLAIM" ? "RESOLVED" : "UNDER_REVIEW",
        resolution_strategy: strategy,
        acknowledged_at: new Date().toISOString(),
      },
      trace,
    };
  }

  try {
    const res = await fetch(`${PAYPAL_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path,
      status: res.status,
      paypalDebugId: res.headers.get("paypal-debug-id"),
      latencyMs: Math.round(performance.now() - start),
      requestId,
      simulated: false,
    };

    const data = await res.json();
    return { data, trace };
  } catch (err: unknown) {
    const trace: PayPalAuditTrace = {
      timestamp: new Date().toISOString(),
      method: "POST",
      path,
      status: 500,
      paypalDebugId: null,
      latencyMs: Math.round(performance.now() - start),
      requestId,
      simulated: false,
    };
    return { data: { error: err instanceof Error ? err.message : String(err) }, trace };
  }
}
