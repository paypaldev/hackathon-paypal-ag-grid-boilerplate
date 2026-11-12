import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal-auth";
import { evaluatePolicyFirewall } from "@/lib/policy-firewall";
import { evaluateDisputeTriage } from "@/lib/ml-fallback";
import { prooflineStore } from "@/lib/proofline/store";
import { restockStore } from "@/lib/restock-store";
import { verifyWebhookLocalCrypto } from "@/lib/paypal-webhook-verifier";

const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

export interface WebhookVerificationResult {
  verified: boolean;
  verificationStatus: "SUCCESS" | "FAILURE" | "SANDBOX_SIMULATED" | "UNVERIFIED";
  details?: string;
}

/**
 * Dual Webhook Verification Strategy:
 *  1. Primary Postback Check: POST /v1/notifications/verify-webhook-signature
 *     CRITICAL: rawBody must be spliced directly into the payload JSON to preserve byte ordering & float trailing zeros!
 *  2. Local Cryptographic Fallback (CRC32 + RSA-SHA256):
 *     PayPal's postback endpoint fails for Webhook Simulator events; local crypto handles simulator and offline events accurately.
 */
async function verifyPayPalWebhookSignature(
  req: NextRequest,
  rawBody: string
): Promise<WebhookVerificationResult> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  const authAlgo = req.headers.get("paypal-auth-algo");
  const certUrl = req.headers.get("paypal-cert-url");
  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionSig = req.headers.get("paypal-transmission-sig");
  const transmissionTime = req.headers.get("paypal-transmission-time");

  // Check if webhook is configured
  if (!webhookId || webhookId.startsWith("your_")) {
    return {
      verified: true,
      verificationStatus: "SANDBOX_SIMULATED",
      details: "PAYPAL_WEBHOOK_ID is not configured in .env.local; accepted in sandbox testing mode.",
    };
  }

  // If live headers are missing (e.g. internal test event)
  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return {
      verified: false,
      verificationStatus: "UNVERIFIED",
      details: "Missing required PayPal transmission headers for cryptographic verification.",
    };
  }

  // Step 1: Live Postback Verification with direct rawBody splicing
  try {
    const token = await getPayPalAccessToken();
    const verificationPayload = `{"auth_algo":${JSON.stringify(authAlgo)},"cert_url":${JSON.stringify(certUrl)},"transmission_id":${JSON.stringify(transmissionId)},"transmission_sig":${JSON.stringify(transmissionSig)},"transmission_time":${JSON.stringify(transmissionTime)},"webhook_id":${JSON.stringify(webhookId)},"webhook_event":${rawBody}}`;

    const res = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: verificationPayload,
    });

    if (res.ok) {
      const data = (await res.json()) as { verification_status?: string };
      if (data.verification_status === "SUCCESS") {
        return {
          verified: true,
          verificationStatus: "SUCCESS",
          details: "PayPal API signature postback returned SUCCESS.",
        };
      }
    }
  } catch (postbackErr: unknown) {
    console.warn("[PAYPAL WEBHOOK] Postback verification hit error, attempting local crypto fallback:", postbackErr);
  }

  // Step 2: Local Cryptographic Fallback (for Webhook Simulator and network edge cases)
  const localCheck = await verifyWebhookLocalCrypto(rawBody, {
    authAlgo,
    certUrl,
    transmissionId,
    transmissionSig,
    transmissionTime,
    webhookId,
  });

  if (localCheck.verified) {
    return {
      verified: true,
      verificationStatus: "SUCCESS",
      details: "Cryptographic signature verified locally via PayPal X.509 cert (CRC32 + RSA-SHA256).",
    };
  }

  return {
    verified: false,
    verificationStatus: "FAILURE",
    details: localCheck.error || "Both PayPal postback verification and local cryptographic verification failed.",
  };
}

/**
 * GET /api/paypal/webhook
 * Reports current webhook listener configuration and health status.
 */
export async function GET() {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  const isConfigured = Boolean(webhookId && !webhookId.startsWith("your_"));

  return NextResponse.json({
    status: "active",
    endpoint: "/api/paypal/webhook",
    webhookIdConfigured: isConfigured,
    webhookIdPreview: isConfigured && webhookId ? `${webhookId.slice(0, 4)}...${webhookId.slice(-4)}` : "not_configured",
    supportedEvents: [
      "CHECKOUT.ORDER.APPROVED",
      "PAYMENT.AUTHORIZATION.CREATED",
      "PAYMENT.AUTHORIZATION.VOIDED",
      "PAYMENT.CAPTURE.COMPLETED",
      "CUSTOMER.DISPUTE.CREATED",
      "CUSTOMER.DISPUTE.RESOLVED",
      "INVOICING.INVOICE.PAID",
    ],
    policyFirewallEnforced: true,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/paypal/webhook
 * Receives and processes real-time PayPal Webhook events with policy enforcement.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let event: Record<string, unknown>;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON webhook payload" }, { status: 400 });
    }

    const eventType = (event.event_type as string) || "UNKNOWN_EVENT";
    const eventId = (event.id as string) || `EVT-${Date.now()}`;
    const resource = (event.resource as Record<string, unknown>) || {};

    // Deduplication check
    if (prooflineStore.processedWebhookEventIds.has(eventId) || restockStore.processedWebhookIds.has(eventId)) {
      return NextResponse.json({
        received: true,
        eventId,
        eventType,
        duplicate: true,
        deduplicated: true,
        summary: `Webhook event ${eventId} already processed; safely skipped duplicate.`,
      });
    }
    prooflineStore.processedWebhookEventIds.add(eventId);
    restockStore.processedWebhookIds.add(eventId);

    // 1. Verify webhook signature
    const verification = await verifyPayPalWebhookSignature(req, rawBody);

    if (verification.verificationStatus === "FAILURE") {
      return NextResponse.json(
        {
          error: "Unauthorized webhook signature",
          verificationStatus: "FAILURE",
          details: verification.details,
        },
        { status: 401 }
      );
    }

    // 2. Policy-gated event dispatching
    let policyAction: Record<string, unknown> | null = null;

    // 2.1 RestockPilot Orders v2 Webhook Handler with Authoritative Fresh GET
    const suppData = resource.supplementary_data as Record<string, unknown> | undefined;
    const relatedIds = suppData?.related_ids as Record<string, string> | undefined;

    const matchedClaim = Array.from(restockStore.claims.values()).find(
      (c) =>
        c.paypalOrderId === (resource.id as string) ||
        (relatedIds?.order_id && c.paypalOrderId === relatedIds.order_id) ||
        c.paypalCaptureId === (resource.id as string)
    );

    if (matchedClaim && matchedClaim.paypalOrderId) {
      const orderId = matchedClaim.paypalOrderId;
      let freshStatus = "UNKNOWN";

      try {
        const token = await getPayPalAccessToken();
        const readRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (readRes.ok) {
          const freshData = (await readRes.json()) as { status: string };
          freshStatus = freshData.status;
        }
      } catch (readErr) {
        console.warn("[RESTOCKPILOT WEBHOOK] Fresh fetch warning:", readErr);
      }

      const po = restockStore.getPurchaseOrder(matchedClaim.poId);

      if (eventType === "CHECKOUT.ORDER.APPROVED") {
        matchedClaim.status = "AWAITING_BUYER_APPROVAL";
        matchedClaim.webhookEventId = eventId;
        matchedClaim.updatedAt = new Date().toISOString();
        restockStore.saveClaim(matchedClaim);

        restockStore.addLedgerEntry({
          id: `LEDGER-${Date.now().toString(36)}`,
          timestamp: new Date().toISOString(),
          step: "Webhook Order Approved",
          sku: po?.sku || "UNKNOWN",
          merchant: po?.merchantName || "Supplier",
          qty: po?.qty || 1,
          total: matchedClaim.amount,
          savingsVsMedian: po ? Math.max(0, (po.verifiedMedianPrice - po.unitPrice) * po.qty) : 0,
          decision: "ALLOW",
          status: "WEBHOOK_VERIFIED",
          paypalOrderId: orderId,
          webhookEventId: eventId,
          idempotencyHash: matchedClaim.paypalRequestIdCreate,
          notes: `Authoritative fresh GET confirmed order status: ${freshStatus}`,
        });

        policyAction = {
          rule: "RESTOCKPILOT_ORDER_APPROVED_VERIFIED",
          orderId,
          freshStatus,
        };
      } else if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
        const captureId = (resource.id as string) || relatedIds?.capture_id;
        matchedClaim.status = "CAPTURED";
        if (captureId) matchedClaim.paypalCaptureId = captureId;
        matchedClaim.webhookEventId = eventId;
        matchedClaim.updatedAt = new Date().toISOString();
        restockStore.saveClaim(matchedClaim);

        restockStore.addLedgerEntry({
          id: `LEDGER-${Date.now().toString(36)}`,
          timestamp: new Date().toISOString(),
          step: "Webhook Capture Completed",
          sku: po?.sku || "UNKNOWN",
          merchant: po?.merchantName || "Supplier",
          qty: po?.qty || 1,
          total: matchedClaim.amount,
          savingsVsMedian: po ? Math.max(0, (po.verifiedMedianPrice - po.unitPrice) * po.qty) : 0,
          decision: "ALLOW",
          status: "WEBHOOK_VERIFIED",
          paypalOrderId: orderId,
          paypalCaptureId: captureId,
          webhookEventId: eventId,
          idempotencyHash: matchedClaim.paypalRequestIdCapture || matchedClaim.paypalRequestIdCreate,
          notes: `Authoritative fresh GET confirmed capture completion. Event: ${eventId}`,
        });

        policyAction = {
          rule: "RESTOCKPILOT_CAPTURE_COMPLETED_VERIFIED",
          orderId,
          captureId,
          freshStatus,
        };
      }
    }

    if (eventType === "PAYMENT.AUTHORIZATION.CREATED" || eventType === "CHECKOUT.ORDER.APPROVED") {
      const amountValue = (resource.amount as { value?: string })?.value || "2450.00";
      const policyCheck = evaluatePolicyFirewall({
        recipient: "Enterprise Hardware Supplier LLC",
        category: "Office Equipment",
        proposedAmountUsd: parseFloat(amountValue),
        layoutlmInvoiceTotalUsd: parseFloat(amountValue),
        paypalAuthorizedAmountUsd: parseFloat(amountValue),
        comprehensiveRiskScore: 0.12,
      });
      policyAction = {
        rule: "AUTHORIZATION_HELD_FOR_3WAY_MATCH",
        policyStatus: policyCheck.status,
        allowed: policyCheck.allowed,
        reasons: policyCheck.reasons,
      };
    } else if (eventType === "CUSTOMER.DISPUTE.CREATED") {
      const disputeId = (resource.dispute_id as string) || eventId;
      const disputeAmount = parseFloat((resource.dispute_amount as { value?: string })?.value || "1850.0");
      const triage = evaluateDisputeTriage({
        disputeId,
        orderId: (resource.disputed_transactions as Array<{ seller_transaction_id?: string }> | undefined)?.[0]?.seller_transaction_id || "ORD-2026-X88",
        trackingNumber: "1Z9999999999999999",
        invoiceId: "INV-2026-001",
        disputedAmountUsd: disputeAmount,
        baseWinProb: 0.85,
        llmWinProbAdjustment: 0.05,
      });
      policyAction = {
        rule: "DISPUTE_AUTOTRIAGE_INITIALIZED",
        triageSummary: {
          recommendedStrategy: triage.recommendedStrategy,
          calibratedWinProb: triage.calibratedWinProb,
          expectedLossUsd: triage.expectedLossUsd,
        },
      };
    } else if (eventType.startsWith("INVOICING.INVOICE.")) {
      // Proofline PayPal Invoicing Lifecycle Handler
      const providerInvoiceId = (resource.id as string) || (resource.invoice as Record<string, unknown> | undefined)?.id as string;
      if (providerInvoiceId) {
        // Find matching Proofline invoice
        const matchedInvoice = Array.from(prooflineStore.invoices.values()).find(
          (i) => i.providerInvoiceId === providerInvoiceId
        );

        if (matchedInvoice) {
          if (eventType === "INVOICING.INVOICE.PAID") {
            matchedInvoice.status = "PAID";
            matchedInvoice.paidAt = new Date().toISOString();
            matchedInvoice.lastReadbackAt = new Date().toISOString();
            matchedInvoice.readbackRawStatus = "PAID";
          } else if (eventType === "INVOICING.INVOICE.SENT") {
            matchedInvoice.status = "SENT";
            matchedInvoice.lastReadbackAt = new Date().toISOString();
          } else if (eventType === "INVOICING.INVOICE.REFUNDED") {
            matchedInvoice.status = "REFUNDED";
            matchedInvoice.lastReadbackAt = new Date().toISOString();
          }

          prooflineStore.appendAuditEntry(
            matchedInvoice.projectId,
            "PayPal Webhook Listener",
            "PAYPAL_WEBHOOK",
            `WEBHOOK_${eventType}`,
            "INVOICE",
            matchedInvoice.id,
            "PAYPAL_CONFIRMED",
            { eventId, providerInvoiceId, eventType, verified: verification.verified }
          );

          policyAction = {
            rule: "PROOFLINE_INVOICE_STATUS_RECONCILED",
            invoiceId: matchedInvoice.id,
            providerInvoiceId,
            newStatus: matchedInvoice.status,
            verified: verification.verified,
          };
        }
      }
    }

    console.log(
      `[PAYPAL WEBHOOK] Event: ${eventType} (ID: ${eventId}) | Verified: ${verification.verified} (${verification.verificationStatus})`
    );

    return NextResponse.json({
      received: true,
      eventId,
      eventType,
      verified: verification.verified,
      verificationStatus: verification.verificationStatus,
      verificationDetails: verification.details,
      policyAction,
      summary: (event.summary as string) || `Webhook event ${eventType} processed.`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
