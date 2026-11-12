import type {
  CurrencyCode,
  PolicyEvaluationResult,
  ScopeVersion,
} from './types';

export interface ProoflinePolicyConstitution {
  policyVersion: string;
  allowedCurrencies: CurrencyCode[];
  maxSingleInvoiceMinor: number; // e.g. $10,000 = 1000000
  requireHumanApprovalAboveMinor: number; // e.g. $2,000 = 200000
  allowUnconfirmedScopeInvoicing: boolean; // Must always be false!
}

export const DEFAULT_PROOFLINE_POLICY: ProoflinePolicyConstitution = {
  policyVersion: '2026.PROOF.1',
  allowedCurrencies: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'],
  maxSingleInvoiceMinor: 1000000, // $10,000.00 max per milestone
  requireHumanApprovalAboveMinor: 250000, // $2,500.00 requires freelancer 2FA / explicit confirmation
  allowUnconfirmedScopeInvoicing: false,
};

export interface InvoicePolicyEvaluationInput {
  milestoneId: string;
  amountMinor: number;
  currency: CurrencyCode;
  activeScopeVersion: ScopeVersion | null;
  proposedByRole: 'FREELANCER' | 'CLIENT' | 'SYSTEM' | 'AI_AGENT';
  idempotencyKey?: string;
  previouslyIssuedInvoiceIdsForMilestone?: string[];
}

/**
 * Pure deterministic reference monitor for Proofline financial actions.
 * No LLM is permitted to bypass this firewall.
 */
export function evaluateInvoicePolicy(
  input: InvoicePolicyEvaluationInput,
  constitution: ProoflinePolicyConstitution = DEFAULT_PROOFLINE_POLICY
): PolicyEvaluationResult {
  const reasons: string[] = [];
  const evaluatedAt = new Date().toISOString();

  // 1. Role Check: AI Agents cannot directly initiate monetary requests
  if (input.proposedByRole === 'AI_AGENT') {
    return {
      outcome: 'BLOCK',
      policyId: constitution.policyVersion,
      reasons: ['CRITICAL: AI Agents are strictly advisory and cannot initiate financial transactions directly.'],
      maxAuthorizedMinor: 0,
      evaluatedAt,
    };
  }

  // 2. Scope Version Check: Scope must exist and be in ACCEPTED status
  if (!input.activeScopeVersion) {
    return {
      outcome: 'BLOCK',
      policyId: constitution.policyVersion,
      reasons: ['Invoice cannot be created without an active, accepted ScopeVersion.'],
      maxAuthorizedMinor: 0,
      evaluatedAt,
    };
  }

  if (input.activeScopeVersion.status !== 'ACCEPTED') {
    return {
      outcome: 'BLOCK',
      policyId: constitution.policyVersion,
      reasons: [`ScopeVersion v${input.activeScopeVersion.versionNumber} is in state ${input.activeScopeVersion.status}. Invoices require an ACCEPTED agreement.`],
      maxAuthorizedMinor: 0,
      evaluatedAt,
    };
  }

  // 3. Currency Check
  if (!constitution.allowedCurrencies.includes(input.currency)) {
    return {
      outcome: 'BLOCK',
      policyId: constitution.policyVersion,
      reasons: [`Currency ${input.currency} is not in the allowed policy list: ${constitution.allowedCurrencies.join(', ')}`],
      maxAuthorizedMinor: 0,
      evaluatedAt,
    };
  }

  // 4. Milestone Binding Check
  const milestone = input.activeScopeVersion.content.milestones.find((m) => m.id === input.milestoneId);
  if (!milestone) {
    return {
      outcome: 'BLOCK',
      policyId: constitution.policyVersion,
      reasons: [`Milestone ${input.milestoneId} does not exist in accepted ScopeVersion v${input.activeScopeVersion.versionNumber}.`],
      maxAuthorizedMinor: 0,
      evaluatedAt,
    };
  }

  // 5. Amount Sanity & Boundary Check
  if (input.amountMinor <= 0) {
    return {
      outcome: 'BLOCK',
      policyId: constitution.policyVersion,
      reasons: ['Invoice amount must be a positive integer minor unit.'],
      maxAuthorizedMinor: 0,
      evaluatedAt,
    };
  }

  if (input.amountMinor > constitution.maxSingleInvoiceMinor) {
    return {
      outcome: 'BLOCK',
      policyId: constitution.policyVersion,
      reasons: [
        `Requested amount (${input.currency} ${(input.amountMinor / 100).toFixed(2)}) exceeds single invoice policy ceiling of ${(constitution.maxSingleInvoiceMinor / 100).toFixed(2)}.`,
      ],
      maxAuthorizedMinor: constitution.maxSingleInvoiceMinor,
      evaluatedAt,
    };
  }

  // 6. Check for agreement amount mismatch
  if (milestone.amountMinor !== null && input.amountMinor > milestone.amountMinor) {
    return {
      outcome: 'BLOCK',
      policyId: constitution.policyVersion,
      reasons: [
        `Invoice amount (${input.currency} ${(input.amountMinor / 100).toFixed(2)}) exceeds agreed milestone amount (${input.currency} ${(milestone.amountMinor / 100).toFixed(2)}). An accepted change order is required first.`,
      ],
      maxAuthorizedMinor: milestone.amountMinor,
      evaluatedAt,
    };
  }

  // 7. Duplicate Milestone Invoicing Check
  if (
    input.previouslyIssuedInvoiceIdsForMilestone &&
    input.previouslyIssuedInvoiceIdsForMilestone.length > 0
  ) {
    reasons.push(`Milestone ${input.milestoneId} already has active invoice(s). Secondary invoice creation requires human approval.`);
    return {
      outcome: 'REQUIRE_HUMAN',
      policyId: constitution.policyVersion,
      reasons,
      maxAuthorizedMinor: input.amountMinor,
      evaluatedAt,
    };
  }

  // 8. High Value Check
  if (input.amountMinor >= constitution.requireHumanApprovalAboveMinor) {
    reasons.push(
      `Amount is above the automated threshold (${(constitution.requireHumanApprovalAboveMinor / 100).toFixed(2)}). Manual confirmation required before dispatching to PayPal.`
    );
    return {
      outcome: 'REQUIRE_HUMAN',
      policyId: constitution.policyVersion,
      reasons,
      maxAuthorizedMinor: input.amountMinor,
      evaluatedAt,
    };
  }

  // Passed all gates!
  reasons.push('All deterministic policy checks passed: verified accepted scope binding, currency compliance, and budget limits.');
  return {
    outcome: 'ALLOW',
    policyId: constitution.policyVersion,
    reasons,
    maxAuthorizedMinor: input.amountMinor,
    evaluatedAt,
  };
}

/**
 * Validates that an acceptance or change order action is NOT approving a stale scope version.
 */
export function validateScopeVersionFreshness(
  proposedBaseHash: string,
  currentAcceptedVersion: ScopeVersion | null
): { valid: boolean; reason?: string } {
  if (!currentAcceptedVersion) {
    return { valid: true };
  }
  if (currentAcceptedVersion.contentSha256 !== proposedBaseHash) {
    return {
      valid: false,
      reason: `STALE_SCOPE_VERSION: Action was predicated on scope hash ${proposedBaseHash.slice(0, 10)}..., but current accepted version is ${currentAcceptedVersion.contentSha256.slice(0, 10)}... (v${currentAcceptedVersion.versionNumber}). Please refresh and review latest scope.`,
    };
  }
  return { valid: true };
}

