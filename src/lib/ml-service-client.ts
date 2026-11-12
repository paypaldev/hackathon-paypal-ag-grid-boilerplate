import "server-only";
import {
  evaluate3WayMatch,
  evaluateEarlyDiscountSkepticGate,
  evaluateDisputeTriage,
  Multimodal3WayMatchResult,
  SkepticGateResult,
  DisputeTriageResult,
} from "./ml-fallback";
import { extractInvoiceWithGemini, ExtractedInvoiceSchema } from "./gemini";

/**
 * VeriSettle AI — Python FastAPI ML Service Client
 * 
 * Bridges the Next.js enterprise backend with the Python ML microservice (FastAPI).
 * Gracefully cascades to high-performance zero-latency TypeScript fallback if the
 * container is unconfigured, unreachable, or in cold-start.
 */

const rawMlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
export const ML_SERVICE_URL =
  rawMlUrl.startsWith("http://") || rawMlUrl.startsWith("https://")
    ? rawMlUrl
    : `http://${rawMlUrl}`;

export interface MlServiceHealth {
  status: "healthy" | "unreachable_using_fallback";
  service: string;
  url: string;
  version?: string;
  models?: string[];
  latencyMs?: number;
  message: string;
  error?: string;
  timestamp: string;
}

export interface ExtractDocumentMlResponse {
  source: "python_fastapi_ml" | "gemini_multimodal_fallback";
  extracted: ExtractedInvoiceSchema;
  reconciliation: Multimodal3WayMatchResult;
  latencyMs: number;
}

/**
 * Checks health of the Python FastAPI ML microservice.
 */
export async function checkMlServiceHealth(): Promise<MlServiceHealth> {
  const start = performance.now();
  try {
    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });

    const latencyMs = Math.round(performance.now() - start);

    if (res.ok) {
      const data = (await res.json()) as { version?: string; models?: string[]; service?: string };
      return {
        status: "healthy",
        service: data.service || "VeriSettle AI ML Service",
        url: ML_SERVICE_URL,
        version: data.version || "2026.1.0",
        models: data.models || [],
        latencyMs,
        message: "Python FastAPI ML service connected and healthy.",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: "unreachable_using_fallback",
      service: "VeriSettle AI ML Service (Fallback Mode)",
      url: ML_SERVICE_URL,
      latencyMs,
      message: `Python ML service returned HTTP ${res.status}. Operating with zero-latency TypeScript ML engine.`,
      error: `HTTP ${res.status}`,
      timestamp: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: "unreachable_using_fallback",
      service: "VeriSettle AI TypeScript Fallback Engine",
      url: ML_SERVICE_URL,
      latencyMs,
      message: "Python ML service offline/unreachable. Operating with zero-latency TypeScript ML fallback.",
      error: message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Multimodal Document Extraction & 3-Way Match Reconciliation
 */
export async function extractDocumentMl(
  rawText: string,
  paypalAuthorizedAmount: number = 0,
  channel3PoQuote: number = 0
): Promise<ExtractDocumentMlResponse> {
  const start = performance.now();

  // Try Python FastAPI ML Service first if ML_MODE != "cached"
  const mlMode = process.env.ML_MODE || "auto";
  if (mlMode !== "cached") {
    try {
      const res = await fetch(`${ML_SERVICE_URL}/ml/extract-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: rawText,
          paypal_authorized_amount: paypalAuthorizedAmount,
          channel3_po_quote: channel3PoQuote,
        }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        const latencyMs = Math.round(performance.now() - start);
        return {
          source: "python_fastapi_ml",
          extracted: data.extracted,
          reconciliation: data.reconciliation,
          latencyMs,
        };
      }
    } catch {
      // Cascade to Gemini + TS fallback
    }
  }

  // Graceful fallback to Gemini / TS 3-Way Match
  const extracted = await extractInvoiceWithGemini(rawText);
  const reconciliation = evaluate3WayMatch({
    channel3QuoteUsd: channel3PoQuote,
    paypalAuthorizedAmountUsd: paypalAuthorizedAmount,
    extractedInvoiceTotalUsd: extracted.total_amount,
    extractedSupplierName: extracted.company_name,
  });

  return {
    source: "gemini_multimodal_fallback",
    extracted,
    reconciliation,
    latencyMs: Math.round(performance.now() - start),
  };
}

/**
 * Score Transaction Risk via Python Risk Engine (XGBoost + GAT) or Fallback
 */
export async function scoreTransactionRiskMl(params: {
  amount: number;
  category: string;
  unitPrice: number;
  channel3CategoryMean?: number;
  channel3CategoryStd?: number;
  priorOrders?: Array<Record<string, unknown>>;
  carrierDelivered?: boolean;
}): Promise<{ source: string; riskEvaluation: Record<string, unknown>; latencyMs: number }> {
  const start = performance.now();

  try {
    const res = await fetch(`${ML_SERVICE_URL}/ml/score-transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: params.amount,
        category: params.category,
        unit_price: params.unitPrice,
        channel3_category_mean: params.channel3CategoryMean ?? 120.0,
        channel3_category_std: params.channel3CategoryStd ?? 15.0,
        prior_orders: params.priorOrders ?? [],
        carrier_delivered: params.carrierDelivered ?? true,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        source: "python_fastapi_ml",
        riskEvaluation: data.risk_evaluation,
        latencyMs: Math.round(performance.now() - start),
      };
    }
  } catch {
    // Fallback
  }

  // Deterministic calculation
  const zScore =
    params.channel3CategoryStd && params.channel3CategoryStd > 0
      ? (params.unitPrice - (params.channel3CategoryMean ?? 120.0)) / params.channel3CategoryStd
      : 0;

  const riskScore = zScore > 2.0 ? 0.75 : 0.08;
  return {
    source: "typescript_fallback",
    riskEvaluation: {
      comprehensive_risk_score: riskScore,
      anomaly_zscore: Math.round(zScore * 100) / 100,
      risk_tier: riskScore > 0.7 ? "HIGH_RISK" : "LOW_RISK",
      auto_approve_eligible: riskScore <= 0.7,
    },
    latencyMs: Math.round(performance.now() - start),
  };
}

/**
 * Economic Evaluation: Invoicing v2 Skeptic Gate or Disputes v1 Triage
 */
export async function evaluateEconomicsMl(params: {
  useCase: "INVOICE_DISCOUNT_GATE" | "DISPUTE_TRIAGE";
  invoiceValue?: number;
  pOnTime?: number;
  annualCapitalCost?: number;
  disputeId?: string;
  orderId?: string;
  trackingNumber?: string;
  invoiceId?: string;
  disputedAmount?: number;
  baseWinProb?: number;
  llmWinProbAdjustment?: number;
}): Promise<{ source: string; result: SkepticGateResult | DisputeTriageResult; latencyMs: number }> {
  const start = performance.now();

  try {
    const res = await fetch(`${ML_SERVICE_URL}/ml/evaluate-economics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        use_case: params.useCase,
        invoice_value: params.invoiceValue,
        p_on_time: params.pOnTime,
        annual_capital_cost: params.annualCapitalCost,
        dispute_id: params.disputeId,
        order_id: params.orderId,
        tracking_number: params.trackingNumber,
        invoice_id: params.invoiceId,
        disputed_amount: params.disputedAmount,
        base_win_prob: params.baseWinProb,
        llm_win_prob_adjustment: params.llmWinProbAdjustment,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        source: "python_fastapi_ml",
        result: data.result,
        latencyMs: Math.round(performance.now() - start),
      };
    }
  } catch {
    // Fallback
  }

  // TypeScript Engine
  if (params.useCase === "INVOICE_DISCOUNT_GATE") {
    const result = evaluateEarlyDiscountSkepticGate({
      invoiceValueUsd: params.invoiceValue ?? 2500.0,
      pOnTimeClient: params.pOnTime ?? 0.90,
      annualCapitalCost: params.annualCapitalCost ?? 0.15,
    });
    return {
      source: "typescript_fallback",
      result,
      latencyMs: Math.round(performance.now() - start),
    };
  } else {
    const result = evaluateDisputeTriage({
      disputeId: params.disputeId ?? "PP-D-84920",
      orderId: params.orderId ?? "ORD-2026-X88",
      trackingNumber: params.trackingNumber ?? "1Z9999999999999999",
      invoiceId: params.invoiceId ?? "INV-2026-001",
      disputedAmountUsd: params.disputedAmount ?? 1850.0,
      baseWinProb: params.baseWinProb ?? 0.85,
      llmWinProbAdjustment: params.llmWinProbAdjustment ?? 0.05,
    });
    return {
      source: "typescript_fallback",
      result,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}

