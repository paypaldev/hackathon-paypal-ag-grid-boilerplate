/**
 * Proofline Domain & State Model
 * 
 * Versioned proof-to-payment chain for independent professionals:
 * Every promise, scope change, delivered artifact, client decision,
 * and PayPal transaction is connected to the exact version of the agreement it belongs to.
 * 
 * Invariants:
 *  - Money stored as integer minor units (cents/paise) with explicit ISO currency code.
 *  - Scope versions are immutable snapshots identified by cryptographic SHA-256 content digests.
 *  - Evidence provenance is strictly distinguished (never merge AI inference with confirmed facts).
 */

export type EvidenceProvenance =
  | 'CLIENT_CLAIM'
  | 'FREELANCER_STATEMENT'
  | 'SYSTEM_CHECK'
  | 'PAYPAL_CONFIRMED'
  | 'AI_INFERENCE';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AUD' | 'CAD';

export interface SourceSpan {
  id: string;
  sourceDocumentId: string;
  messageId?: string;
  startOffset: number;
  endOffset: number;
  quotedText: string;
}

export interface SourceDocument {
  id: string;
  projectId: string;
  sourceType: 'CLIENT_CHAT' | 'EMAIL' | 'MEETING_NOTES' | 'BRIEF';
  rawText: string;
  submittedBy: string;
  createdAt: string;
}

export interface ScopeFieldEvidence {
  id: string;
  fieldPath: string; // e.g. "deliverables[0].title", "milestones[0].amount_minor"
  sourceSpan?: SourceSpan;
  confidence: number; // 0.0 - 1.0
  needsConfirmation: boolean;
  notes?: string;
}

export interface ScopeDeliverable {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface ScopeMilestone {
  id: string;
  title: string;
  amountMinor: number | null; // Null if not in source; never guess!
  currency: CurrencyCode | null;
  dueAt: string | null; // ISO string or null
  deliverableIds: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'APPROVED' | 'INVOICED' | 'PAID';
}

export interface ScopeContent {
  projectGoal: string;
  clientName: string | null;
  freelancerName: string | null;
  deliverables: ScopeDeliverable[];
  milestones: ScopeMilestone[];
  assumptions: string[];
  exclusions: string[];
  missingQuestions: string[];
  currency: CurrencyCode;
  totalAmountMinor: number | null;
}

export interface ScopeVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED';
  content: ScopeContent;
  evidence: ScopeFieldEvidence[];
  contentSha256: string; // SHA-256 digest of canonical content
  createdBy: string;
  acceptedBy: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

export type ChangeClassification =
  | 'IN_SCOPE'
  | 'CLARIFICATION'
  | 'CHANGE_REQUEST'
  | 'AMBIGUOUS';

export interface ChangeOrderDelta {
  deliverablesAdded: ScopeDeliverable[];
  deliverablesModified: Array<{ id: string; changes: Partial<ScopeDeliverable> }>;
  suggestedPriceDeltaMinor: number; // minor units (e.g. +$400.00 = +40000)
  suggestedDaysDelta: number;
  reasoning: string;
  matchedCriteriaIds?: string[];
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  baseScopeVersionId: string;
  baseScopeSha256: string;
  incomingMessage: string;
  classification: ChangeClassification;
  confidence: number;
  delta: ChangeOrderDelta | null;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  acceptedScopeVersionId?: string;
  isProposal: boolean; // Requires human freelancer confirmation
  proposedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type DeliveryCheckStatus = 'PASS' | 'NEEDS_REVIEW' | 'NOT_VERIFIED' | 'FAIL';

export interface DeliveryCheck {
  id: string;
  deliverableId: string;
  criterionText: string;
  checkType: 'DETERMINISTIC_FORMAT' | 'DETERMINISTIC_SIZE' | 'AI_ADVISORY_CRITERION';
  status: DeliveryCheckStatus;
  explanation: string;
  modelVersion?: string;
  createdAt: string;
}

export interface Deliverable {
  id: string;
  milestoneId: string;
  storageKey: string;
  filename: string;
  mediaType: string;
  byteSize: number;
  sha256: string; // Cryptographic hash of content
  uploadedBy: string;
  checks: DeliveryCheck[];
  clientApprovalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUESTED' | 'DISPUTED';
  clientNotes?: string;
  createdAt: string;
}

export interface ClientDecision {
  id: string;
  milestoneId: string;
  scopeVersionId: string;
  decision: 'APPROVE' | 'REQUEST_REVISION' | 'DISPUTE';
  notes: string;
  actorId: string;
  actorRole: 'CLIENT' | 'FREELANCER' | 'SYSTEM';
  createdAt: string;
}

export type ProoflineInvoiceStatus =
  | 'DRAFT'
  | 'CREATED'
  | 'SENT'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED_OR_UNKNOWN';

export interface ProoflineInvoice {
  id: string;
  projectId: string;
  milestoneId: string;
  scopeVersionId: string;
  provider: 'PAYPAL_SANDBOX';
  providerInvoiceId: string | null; // Official PayPal invoice ID (e.g. INV2-xxxx)
  invoiceNumber: string;
  amountMinor: number;
  currency: CurrencyCode;
  status: ProoflineInvoiceStatus;
  recipientEmail: string;
  recipientBusinessName?: string;
  hostedPaymentUrl?: string;
  lastReadbackAt?: string;
  readbackRawStatus?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PayPalEventRecord {
  id: string;
  providerEventId: string;
  eventType: string;
  receivedAt: string;
  verifiedAt: string | null;
  processedAt: string | null;
  status: 'RECEIVED' | 'VERIFIED' | 'PROCESSED' | 'DUPLICATE' | 'SIGNATURE_FAILED';
  resourceId?: string;
  rawPayload?: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  outcome: 'ALLOW' | 'REQUIRE_HUMAN' | 'BLOCK';
  policyId: string;
  reasons: string[];
  maxAuthorizedMinor: number;
  evaluatedAt: string;
}

export interface AuditEntry {
  id: string;
  projectId: string;
  actorId: string;
  actorRole: 'FREELANCER' | 'CLIENT' | 'SYSTEM' | 'PAYPAL_WEBHOOK';
  action: string;
  objectType: 'SCOPE_VERSION' | 'CHANGE_ORDER' | 'DELIVERABLE' | 'INVOICE' | 'DECISION' | 'PAYMENT';
  objectId: string;
  provenance: EvidenceProvenance;
  payloadDigest: string;
  previousDigest: string;
  timestamp: string;
}

export interface Project {
  id: string;
  ownerId: string;
  clientEmail: string;
  clientName: string;
  freelancerName: string;
  title: string;
  currency: CurrencyCode;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED';
  activeScopeVersionId: string | null;
  sourceDocuments: SourceDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ProofReceipt {
  projectId: string;
  projectTitle: string;
  generatedAt: string;
  receiptFingerprint: string;
  freelancer: { name: string; email?: string };
  client: { name: string; email: string };
  activeScopeVersion: {
    version: number;
    sha256: string;
    acceptedAt: string | null;
    acceptedBy: string | null;
    totalAmountFormatted: string;
  };
  sourceCitations: Array<{
    quote: string;
    field: string;
    confidence: number;
  }>;
  changeOrders: Array<{
    id: string;
    status: string;
    message: string;
    priceDeltaFormatted: string;
    acceptedAt?: string;
  }>;
  deliverables: Array<{
    id: string;
    filename: string;
    sha256: string;
    byteSize: number;
    deterministicChecksPass: boolean;
    clientDecision: string;
  }>;
  paypalLedger: Array<{
    invoiceId: string;
    providerInvoiceId: string | null;
    amountFormatted: string;
    status: ProoflineInvoiceStatus;
    lastReadbackAt?: string;
  }>;
  tamperEvidentAuditChain: Array<{
    index: number;
    action: string;
    actor: string;
    provenance: EvidenceProvenance;
    digest: string;
    timestamp: string;
  }>;
}

