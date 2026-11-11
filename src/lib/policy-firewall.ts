import crypto from "crypto";

/**
 * VeriSettle AI — Deterministic Policy Firewall & Cryptographic Spend Monitor
 * 
 * Enforces the Spend Mandate Constitution from PAYPAL.md:
 *  - FIPS 180-4 SHA-256 cryptographic approval digests
 *  - 3-Way Match variance threshold (<= 1.5%)
 *  - Comprehensive Risk Score limit (<= 0.70)
 *  - Greedy agent partial-delivery clamping
 *  - Budget limits ($25k/week, $5k/order, $500 auto-approve)
 *  - Prompt injection detection and fail-closed blocking
 */

export interface PolicyConstitution {
  policyVersion: string;
  currency: string;
  maxWeeklyBudgetUsd: number;
  maxSingleOrderUsd: number;
  autoApproveThresholdUsd: number;
  max3WayVariancePct: number;
  maxRiskScore: number;
  allowedCategories: string[];
}

export const VERISETTLE_POLICY: PolicyConstitution = {
  policyVersion: "2026.1.0",
  currency: "USD",
  maxWeeklyBudgetUsd: 25000.0,
  maxSingleOrderUsd: 5000.0,
  autoApproveThresholdUsd: 500.0,
  max3WayVariancePct: 1.5,
  maxRiskScore: 0.7,
  allowedCategories: [
    "Office Equipment",
    "Cloud Hardware",
    "Cafe & Packaging Supplies",
  ],
};

export interface PolicyEvaluationInput {
  recipient: string;
  category: string;
  proposedAmountUsd: number;
  verifiedDeliveredAmountUsd?: number;
  channel3QuoteUsd?: number;
  layoutlmInvoiceTotalUsd?: number;
  paypalAuthorizedAmountUsd?: number;
  comprehensiveRiskScore?: number;
  promptText?: string;
  currentWeeklySpendUsd?: number;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  status:
    | "PASSED"
    | "NEEDS_APPROVAL"
    | "BLOCKED_VARIANCE_EXCEEDED"
    | "BLOCKED_HIGH_RISK"
    | "BLOCKED_BUDGET_EXCEEDED"
    | "BLOCKED_CATEGORY_DISALLOWED"
    | "BLOCKED_PROMPT_INJECTION";
  allowedCaptureAmountUsd: number;
  wasClamped: boolean;
  clampNote?: string;
  variancePct: number;
  computedDigest: string;
  reasons: string[];
}

/**
 * Produces canonical sorted JSON string to ensure deterministic hashing.
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonStringify).join(",") + "]";
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalJsonStringify((obj as Record<string, unknown>)[k])}`
  );
  return "{" + pairs.join(",") + "}";
}

/**
 * Computes a FIPS 180-4 SHA-256 digest over canonical JSON representation
 */
export function computeApprovalDigest(payload: {
  recipient: string;
  verified_amount: number | string;
  order_id: string;
  layoutlm_invoice_total: number | string;
  risk_score: number | string;
}): string {
  const canonical = canonicalJsonStringify({
    order_id: String(payload.order_id),
    recipient: payload.recipient.trim().toLowerCase(),
    risk_score: Number(payload.risk_score).toFixed(4),
    invoice_total: Number(payload.layoutlm_invoice_total).toFixed(2),
    verified_amount: Number(payload.verified_amount).toFixed(2),
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

/**
 * Checks for prompt injection or policy override attempts in raw text
 */
export function detectPromptInjection(text?: string): boolean {
  if (!text) return false;
  const injectionPatterns = [
    /ignore\s+(previous|all|the)\s+instructions/i,
    /ignore\s+paypal\.md/i,
    /bypass\s+(limits|firewall|guardrails|policy)/i,
    /override\s+(policy|budget|mandate)/i,
    /send\s+\$?\d+.*regardless/i,
    /system\s+prompt\s+override/i,
    /jailbreak/i,
    /as\s+an\s+unconstrained\s+agent/i,
  ];
  return injectionPatterns.some((pattern) => pattern.test(text));
}

/**
 * Evaluates the full policy firewall against an incoming financial transaction/proposal.
 */
export function evaluatePolicyFirewall(input: PolicyEvaluationInput): PolicyEvaluationResult {
  const reasons: string[] = [];
  let allowed = true;
  let status: PolicyEvaluationResult["status"] = "PASSED";

  // 1. Prompt Injection Shield
  if (detectPromptInjection(input.promptText)) {
    return {
      allowed: false,
      status: "BLOCKED_PROMPT_INJECTION",
      allowedCaptureAmountUsd: 0,
      wasClamped: false,
      variancePct: 0,
      computedDigest: "REJECTED_PROMPT_INJECTION",
      reasons: ["Untrusted prompt injection attempt detected in request payload. Fails closed."],
    };
  }

  // 2. Category Verification
  const isAllowedCategory = VERISETTLE_POLICY.allowedCategories.some(
    (c) => c.toLowerCase() === input.category.toLowerCase()
  );
  if (!isAllowedCategory) {
    allowed = false;
    status = "BLOCKED_CATEGORY_DISALLOWED";
    reasons.push(`Category '${input.category}' is not in approved list [${VERISETTLE_POLICY.allowedCategories.join(", ")}].`);
  }

  // 3. Single Order and Weekly Budget Limits
  const currentWeekly = input.currentWeeklySpendUsd || 0;
  if (input.proposedAmountUsd > VERISETTLE_POLICY.maxSingleOrderUsd) {
    allowed = false;
    status = "BLOCKED_BUDGET_EXCEEDED";
    reasons.push(
      `Proposed order $${input.proposedAmountUsd.toFixed(2)} exceeds maximum single order cap of $${VERISETTLE_POLICY.maxSingleOrderUsd.toFixed(2)}.`
    );
  }
  if (currentWeekly + input.proposedAmountUsd > VERISETTLE_POLICY.maxWeeklyBudgetUsd) {
    allowed = false;
    status = "BLOCKED_BUDGET_EXCEEDED";
    reasons.push(
      `Weekly spend would reach $${(currentWeekly + input.proposedAmountUsd).toFixed(2)}, exceeding $${VERISETTLE_POLICY.maxWeeklyBudgetUsd.toFixed(2)} cap.`
    );
  }

  // 4. 3-Way Match Variance Check (LayoutLMv3 Invoice vs PayPal Auth / Channel3 PO)
  let variancePct = 0;
  const benchmarkAmount = input.paypalAuthorizedAmountUsd || input.channel3QuoteUsd || 0;
  if (benchmarkAmount > 0 && input.layoutlmInvoiceTotalUsd !== undefined) {
    variancePct = (Math.abs(input.layoutlmInvoiceTotalUsd - benchmarkAmount) / benchmarkAmount) * 100;
    if (variancePct > VERISETTLE_POLICY.max3WayVariancePct) {
      allowed = false;
      status = "BLOCKED_VARIANCE_EXCEEDED";
      reasons.push(
        `3-Way match variance ${variancePct.toFixed(2)}% exceeds allowed threshold of ${VERISETTLE_POLICY.max3WayVariancePct}% (Invoice: $${input.layoutlmInvoiceTotalUsd.toFixed(2)}, Auth: $${benchmarkAmount.toFixed(2)}).`
      );
    }
  }

  // 5. ML Risk Score Firewall
  const risk = input.comprehensiveRiskScore ?? 0.15;
  if (risk > VERISETTLE_POLICY.maxRiskScore) {
    allowed = false;
    if (status === "PASSED") {
      status = "BLOCKED_HIGH_RISK";
    }
    reasons.push(`ML comprehensive risk score ${risk.toFixed(2)} exceeds allowed maximum of ${VERISETTLE_POLICY.maxRiskScore}.`);
  }

  // 6. Partial-Delivery Clamp Invariant
  let allowedCaptureAmountUsd = input.proposedAmountUsd;
  let wasClamped = false;
  let clampNote: string | undefined;

  if (input.verifiedDeliveredAmountUsd !== undefined && input.verifiedDeliveredAmountUsd < input.proposedAmountUsd) {
    wasClamped = true;
    allowedCaptureAmountUsd = input.verifiedDeliveredAmountUsd;
    clampNote = `Greedy agent capture proposal clamped from $${input.proposedAmountUsd.toFixed(2)} to verified delivery $${allowedCaptureAmountUsd.toFixed(2)}.`;
    reasons.push(clampNote);
  }

  // 7. Auto-Approve vs Needs-Approval check
  if (allowed && allowedCaptureAmountUsd > VERISETTLE_POLICY.autoApproveThresholdUsd) {
    status = "NEEDS_APPROVAL";
    reasons.push(
      `Amount $${allowedCaptureAmountUsd.toFixed(2)} exceeds auto-approve threshold of $${VERISETTLE_POLICY.autoApproveThresholdUsd.toFixed(2)}. Explicit human approval required.`
    );
  }

  // 8. Compute Cryptographic SHA-256 Digest
  const computedDigest = computeApprovalDigest({
    recipient: input.recipient,
    verified_amount: allowedCaptureAmountUsd,
    order_id: "ORD-VERI-" + Date.now().toString(36),
    layoutlm_invoice_total: input.layoutlmInvoiceTotalUsd ?? allowedCaptureAmountUsd,
    risk_score: risk,
  });

  return {
    allowed,
    status,
    allowedCaptureAmountUsd,
    wasClamped,
    clampNote,
    variancePct,
    computedDigest,
    reasons,
  };
}
