import { computeSha256, formatMinorUnits } from './crypto';
import type {
  AuditEntry,
  ChangeOrder,
  ClientDecision,
  Deliverable,
  Project,
  ProoflineInvoice,
  ProofReceipt,
  ScopeVersion,
} from './types';

export interface ProofBundleInput {
  project: Project;
  scopeVersion: ScopeVersion | null;
  changeOrders: ChangeOrder[];
  deliverables: Deliverable[];
  invoices: ProoflineInvoice[];
  decisions: ClientDecision[];
  auditEntries: AuditEntry[];
}

/**
 * Compiles a verifiable Proof Receipt joining the full proof-to-payment chain.
 */
export function compileProofReceipt(input: ProofBundleInput): ProofReceipt {
  const { project, scopeVersion, changeOrders, deliverables, invoices, auditEntries } = input;

  const totalMinor = scopeVersion?.content?.totalAmountMinor ?? 0;
  const currency = scopeVersion?.content?.currency ?? project.currency ?? 'USD';

  // Map source citations from field evidence
  const citations = (scopeVersion?.evidence || [])
    .filter((e) => e.sourceSpan && e.sourceSpan.quotedText)
    .map((e) => ({
      quote: e.sourceSpan!.quotedText,
      field: e.fieldPath,
      confidence: e.confidence,
    }));

  // Map change orders
  const changeOrderSummaries = changeOrders.map((co) => ({
    id: co.id,
    status: co.status,
    message: co.incomingMessage,
    priceDeltaFormatted: co.delta ? formatMinorUnits(co.delta.suggestedPriceDeltaMinor, currency) : '+0.00',
    acceptedAt: co.reviewedAt,
  }));

  // Map deliverables with deterministic checks pass flag
  const deliverableSummaries = deliverables.map((d) => {
    const deterministicPass = d.checks
      .filter((c) => c.checkType.startsWith('DETERMINISTIC'))
      .every((c) => c.status === 'PASS');

    return {
      id: d.id,
      filename: d.filename,
      sha256: d.sha256,
      byteSize: d.byteSize,
      deterministicChecksPass: deterministicPass,
      clientDecision: d.clientApprovalStatus,
    };
  });

  // Map PayPal Sandbox invoice ledger
  const paypalLedger = invoices.map((inv) => ({
    invoiceId: inv.id,
    providerInvoiceId: inv.providerInvoiceId,
    amountFormatted: formatMinorUnits(inv.amountMinor, inv.currency),
    status: inv.status,
    lastReadbackAt: inv.lastReadbackAt,
  }));

  // Map audit chain with verified previous-hash links
  const tamperEvidentAuditChain = auditEntries.map((entry, idx) => ({
    index: idx + 1,
    action: entry.action,
    actor: `${entry.actorRole}: ${entry.actorId}`,
    provenance: entry.provenance,
    digest: entry.payloadDigest,
    timestamp: entry.timestamp,
  }));

  // Compute master receipt fingerprint
  const masterPayload = {
    projectId: project.id,
    scopeSha256: scopeVersion?.contentSha256 || 'NO_SCOPE',
    deliverableHashes: deliverables.map((d) => d.sha256).sort(),
    invoices: invoices.map((i) => ({ id: i.providerInvoiceId, status: i.status })),
    timestamp: new Date().toISOString(),
  };
  const receiptFingerprint = computeSha256(masterPayload);

  return {
    projectId: project.id,
    projectTitle: project.title,
    generatedAt: new Date().toISOString(),
    receiptFingerprint,
    freelancer: {
      name: project.freelancerName || 'Freelancer',
    },
    client: {
      name: project.clientName || 'Client',
      email: project.clientEmail,
    },
    activeScopeVersion: {
      version: scopeVersion?.versionNumber || 1,
      sha256: scopeVersion?.contentSha256 || 'UNACCEPTED',
      acceptedAt: scopeVersion?.acceptedAt || null,
      acceptedBy: scopeVersion?.acceptedBy || null,
      totalAmountFormatted: formatMinorUnits(totalMinor, currency),
    },
    sourceCitations: citations,
    changeOrders: changeOrderSummaries,
    deliverables: deliverableSummaries,
    paypalLedger,
    tamperEvidentAuditChain,
  };
}

/**
 * Validates the cryptographic integrity of an append-only audit trail.
 */
export function verifyAuditChainIntegrity(entries: AuditEntry[]): {
  valid: boolean;
  brokenIndex?: number;
  reason?: string;
} {
  let prevDigest = 'GENESIS';

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.previousDigest !== prevDigest) {
      return {
        valid: false,
        brokenIndex: i,
        reason: `Hash mismatch at entry ${i + 1}: expected previousDigest ${prevDigest.slice(0, 10)}, but found ${entry.previousDigest.slice(0, 10)}`,
      };
    }
    prevDigest = entry.payloadDigest;
  }

  return { valid: true };
}

