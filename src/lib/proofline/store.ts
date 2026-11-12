import { computeAuditChainDigest, computeSha256 } from './crypto';
import type {
  AuditEntry,
  ChangeOrder,
  ClientDecision,
  Deliverable,
  EvidenceProvenance,
  Project,
  ProoflineInvoice,
  ScopeVersion,
} from './types';

// In-Memory Durable Store for Proofline
class ProoflineStore {
  projects: Map<string, Project> = new Map();
  scopeVersions: Map<string, ScopeVersion[]> = new Map(); // projectId -> ScopeVersion[]
  changeOrders: Map<string, ChangeOrder[]> = new Map(); // projectId -> ChangeOrder[]
  deliverables: Map<string, Deliverable[]> = new Map(); // milestoneId -> Deliverable[]
  invoices: Map<string, ProoflineInvoice> = new Map(); // invoiceId -> ProoflineInvoice
  decisions: Map<string, ClientDecision[]> = new Map(); // milestoneId -> ClientDecision[]
  auditTrails: Map<string, AuditEntry[]> = new Map(); // projectId -> AuditEntry[]
  processedWebhookEventIds: Set<string> = new Set();

  constructor() {
    this.seedDemoState();
  }

  // Record an audit entry with verifiable previous-hash chaining
  appendAuditEntry(
    projectId: string,
    actorId: string,
    actorRole: 'FREELANCER' | 'CLIENT' | 'SYSTEM' | 'PAYPAL_WEBHOOK',
    action: string,
    objectType: AuditEntry['objectType'],
    objectId: string,
    provenance: EvidenceProvenance,
    payloadData: unknown
  ): AuditEntry {
    const list = this.auditTrails.get(projectId) || [];
    const prevDigest = list.length > 0 ? list[list.length - 1].payloadDigest : 'GENESIS';
    const timestamp = new Date().toISOString();
    const dataDigest = computeSha256(payloadData);
    const chainDigest = computeAuditChainDigest(prevDigest, timestamp, actorId, action, dataDigest);

    const entry: AuditEntry = {
      id: `audit-${Date.now().toString(36)}-${list.length + 1}`,
      projectId,
      actorId,
      actorRole,
      action,
      objectType,
      objectId,
      provenance,
      payloadDigest: chainDigest,
      previousDigest: prevDigest,
      timestamp,
    };

    list.push(entry);
    this.auditTrails.set(projectId, list);
    return entry;
  }

  seedDemoState() {
    this.projects.clear();
    this.scopeVersions.clear();
    this.changeOrders.clear();
    this.deliverables.clear();
    this.invoices.clear();
    this.decisions.clear();
    this.auditTrails.clear();
    this.processedWebhookEventIds.clear();

    const projectId = 'proj-crossborder-demo';
    const rawBrief = `Hi Priya,

We need you to design and deliver our new Global B2B Billing Dashboard and core Design System.
Budget is fixed at $4,000.00 USD for the initial phase.

Deliverables:
- Deliverable 1: Design Tokens, Figma UI Kit with typography and color schemes.
- Deliverable 2: Responsive Dashboard Layout with data table components.

Payment Milestones:
- Milestone 1: $1,800.00 upon delivery of Design Tokens and Figma Kit.
- Milestone 2: $2,200.00 upon handover of interactive responsive components.

Delivery target is December 15, 2026. Please confirm!`;

    const project: Project = {
      id: projectId,
      ownerId: 'usr-freelancer-priya',
      clientEmail: 'avery@venturehq.io',
      clientName: 'Avery Vance',
      freelancerName: 'Priya Sharma',
      title: 'Global B2B Billing Dashboard & Design System',
      currency: 'USD',
      status: 'ACTIVE',
      activeScopeVersionId: 'scope-v1-accepted',
      sourceDocuments: [
        {
          id: 'src-doc-initial',
          projectId,
          sourceType: 'CLIENT_CHAT',
          rawText: rawBrief,
          submittedBy: 'Avery Vance',
          createdAt: '2026-11-10T10:00:00Z',
        },
      ],
      createdAt: '2026-11-10T10:00:00Z',
      updatedAt: '2026-11-12T08:00:00Z',
    };
    this.projects.set(projectId, project);

    // Seed Scope v1
    const v1Content = {
      projectGoal: 'Design and deliver Global B2B Billing Dashboard and core Design System',
      clientName: 'Avery Vance',
      freelancerName: 'Priya Sharma',
      deliverables: [
        {
          id: 'deliv-tokens',
          title: 'Design Tokens & Figma UI Kit',
          description: 'Comprehensive design tokens, typography scale, palette, and component library.',
          acceptanceCriteria: [
            'Figma component library with auto-layout and dark/light modes',
            'WCAG 2.1 AA accessible contrast ratios across all semantic tokens',
          ],
        },
        {
          id: 'deliv-dashboard',
          title: 'Responsive Billing Dashboard Layout',
          description: 'Interactive dashboard layouts with data grids and telemetry widgets.',
          acceptanceCriteria: [
            'Fully responsive across desktop and tablet viewports',
            'Includes billing telemetry, receivables table, and payment status badges',
          ],
        },
      ],
      milestones: [
        {
          id: 'm-1',
          title: 'Milestone 1: Design Tokens & Figma UI Kit',
          amountMinor: 180000, // $1,800.00
          currency: 'USD' as const,
          dueAt: '2026-12-01T00:00:00Z',
          deliverableIds: ['deliv-tokens'],
          status: 'DELIVERED' as const,
        },
        {
          id: 'm-2',
          title: 'Milestone 2: Responsive Billing Dashboard Layout',
          amountMinor: 220000, // $2,200.00
          currency: 'USD' as const,
          dueAt: '2026-12-15T00:00:00Z',
          deliverableIds: ['deliv-dashboard'],
          status: 'PENDING' as const,
        },
      ],
      assumptions: [
        'Client provides feedback within 48 hours of milestone handover',
        'Maximum 2 revision iterations included per milestone',
      ],
      exclusions: [
        'Backend production API deployment and database hosting',
        'Native iOS/Android application compilation',
      ],
      missingQuestions: [],
      currency: 'USD' as const,
      totalAmountMinor: 400000,
    };

    const v1Sha = computeSha256(v1Content);

    const scopeV1: ScopeVersion = {
      id: 'scope-v1-accepted',
      projectId,
      versionNumber: 1,
      status: 'ACCEPTED',
      content: v1Content,
      evidence: [
        {
          id: 'ev-goal',
          fieldPath: 'projectGoal',
          sourceSpan: {
            id: 'span-goal',
            sourceDocumentId: 'src-doc-initial',
            startOffset: 25,
            endOffset: 97,
            quotedText: 'design and deliver our new Global B2B Billing Dashboard and core Design System',
          },
          confidence: 0.98,
          needsConfirmation: false,
        },
        {
          id: 'ev-budget',
          fieldPath: 'totalAmountMinor',
          sourceSpan: {
            id: 'span-budget',
            sourceDocumentId: 'src-doc-initial',
            startOffset: 116,
            endOffset: 125,
            quotedText: '$4,000.00',
          },
          confidence: 1.0,
          needsConfirmation: false,
        },
      ],
      contentSha256: v1Sha,
      createdBy: 'Priya Sharma',
      acceptedBy: 'Avery Vance',
      acceptedAt: '2026-11-10T14:30:00Z',
      createdAt: '2026-11-10T11:00:00Z',
    };
    this.scopeVersions.set(projectId, [scopeV1]);

    // Initial Audit Trail
    this.appendAuditEntry(
      projectId,
      'Avery Vance',
      'CLIENT',
      'INTAKE_BRIEF_SUBMITTED',
      'SCOPE_VERSION',
      'src-doc-initial',
      'CLIENT_CLAIM',
      { rawBrief }
    );
    this.appendAuditEntry(
      projectId,
      'Priya Sharma & Avery Vance',
      'FREELANCER',
      'SCOPE_VERSION_ACCEPTED',
      'SCOPE_VERSION',
      scopeV1.id,
      'FREELANCER_STATEMENT',
      { version: 1, sha256: v1Sha }
    );

    // Deliverable for Milestone 1
    const deliv1: Deliverable = {
      id: 'deliv-tokens-zip',
      milestoneId: 'm-1',
      storageKey: 'deliverables/m-1/venturehq-design-tokens-v1.zip',
      filename: 'venturehq-design-tokens-v1.zip',
      mediaType: 'application/zip',
      byteSize: 421890,
      sha256: '9f83c12b7a8d4e56c8b91234567890abcdef1234567890abcdef1234567890ab',
      uploadedBy: 'Priya Sharma',
      checks: [
        {
          id: 'chk-1',
          deliverableId: 'deliv-tokens-zip',
          criterionText: 'Deliverable must contain non-zero byte content',
          checkType: 'DETERMINISTIC_SIZE',
          status: 'PASS',
          explanation: 'Verified byte length: 421,890 bytes (412 KB).',
          createdAt: '2026-11-11T12:00:00Z',
        },
        {
          id: 'chk-2',
          deliverableId: 'deliv-tokens-zip',
          criterionText: 'Figma component library with auto-layout and dark/light modes',
          checkType: 'AI_ADVISORY_CRITERION',
          status: 'PASS',
          explanation: '[AI Advisory] Tokens JSON and Figma component export verified against criterion.',
          modelVersion: 'gemini-3.1-flash-lite',
          createdAt: '2026-11-11T12:01:00Z',
        },
      ],
      clientApprovalStatus: 'APPROVED',
      clientNotes: 'Tokens look fantastic. Color contrast confirmed.',
      createdAt: '2026-11-11T12:00:00Z',
    };
    this.deliverables.set('m-1', [deliv1]);

    this.appendAuditEntry(
      projectId,
      'Priya Sharma',
      'FREELANCER',
      'DELIVERABLE_UPLOADED',
      'DELIVERABLE',
      deliv1.id,
      'SYSTEM_CHECK',
      { sha256: deliv1.sha256, filename: deliv1.filename }
    );

    // Decision
    const decision: ClientDecision = {
      id: 'dec-m-1',
      milestoneId: 'm-1',
      scopeVersionId: scopeV1.id,
      decision: 'APPROVE',
      notes: 'Approved without reservation. Proceeding to invoice.',
      actorId: 'Avery Vance',
      actorRole: 'CLIENT',
      createdAt: '2026-11-11T15:00:00Z',
    };
    this.decisions.set('m-1', [decision]);

    this.appendAuditEntry(
      projectId,
      'Avery Vance',
      'CLIENT',
      'CLIENT_APPROVED_MILESTONE',
      'DECISION',
      decision.id,
      'CLIENT_CLAIM',
      decision
    );

    // Seed Invoice for Milestone 1
    const invoice1: ProoflineInvoice = {
      id: 'proof-inv-001',
      projectId,
      milestoneId: 'm-1',
      scopeVersionId: scopeV1.id,
      provider: 'PAYPAL_SANDBOX',
      providerInvoiceId: 'INV2-PRFL-001',
      invoiceNumber: 'INV-2026-001',
      amountMinor: 180000,
      currency: 'USD',
      status: 'SENT',
      recipientEmail: 'avery@venturehq.io',
      recipientBusinessName: 'VentureHQ Inc',
      hostedPaymentUrl: 'https://www.sandbox.paypal.com/invoice/p/#INV2-PRFL-001',
      lastReadbackAt: '2026-11-12T08:00:00Z',
      readbackRawStatus: 'SENT',
      createdAt: '2026-11-11T16:00:00Z',
    };
    this.invoices.set(invoice1.id, invoice1);

    this.appendAuditEntry(
      projectId,
      'PayPal Sandbox REST API',
      'SYSTEM',
      'INVOICE_DISPATCHED_TO_PAYPAL',
      'INVOICE',
      invoice1.id,
      'PAYPAL_CONFIRMED',
      { providerInvoiceId: invoice1.providerInvoiceId, amountMinor: 180000 }
    );

    // Seed an outstanding change order request to showcase the signature demo moment!
    const clientCreepMessage = 'Hey Priya! Loved the desktop tokens. Can you also create a dedicated Mobile Responsive Layout with touch gestures and add another export format for Flutter?';

    const changeOrder1: ChangeOrder = {
      id: 'co-demo-001',
      projectId,
      baseScopeVersionId: scopeV1.id,
      baseScopeSha256: v1Sha,
      incomingMessage: clientCreepMessage,
      classification: 'CHANGE_REQUEST',
      confidence: 0.95,
      delta: {
        deliverablesAdded: [
          {
            id: 'deliv-mobile-flutter',
            title: 'Dedicated Mobile Responsive Views & Flutter Export',
            description: 'Mobile responsive views with touch targets and Flutter widget token format.',
            acceptanceCriteria: [
              'Mobile viewport artboards with touch-safe component geometry',
              'Valid Flutter Dart token export verified',
            ],
          },
        ],
        deliverablesModified: [],
        suggestedPriceDeltaMinor: 65000, // +$650.00
        suggestedDaysDelta: 4,
        reasoning: 'Client requested additions (mobile responsive touch views + Flutter export) outside original accepted Scope v1. Proposed +$650.00 and +4 business days.',
      },
      status: 'PROPOSED',
      isProposal: true,
      proposedBy: 'Priya Sharma (AI Change-Order Agent Assistant)',
      createdAt: '2026-11-12T08:30:00Z',
    };
    this.changeOrders.set(projectId, [changeOrder1]);

    this.appendAuditEntry(
      projectId,
      'Proofline Change Agent',
      'SYSTEM',
      'SCOPE_DRIFT_DETECTED_CHANGE_ORDER_PROPOSED',
      'CHANGE_ORDER',
      changeOrder1.id,
      'AI_INFERENCE',
      { classification: 'CHANGE_REQUEST', delta: changeOrder1.delta }
    );
  }
}

// Global singleton instance
const globalForProofline = globalThis as unknown as { prooflineStore?: ProoflineStore };
export const prooflineStore = globalForProofline.prooflineStore || new ProoflineStore();
if (process.env.NODE_ENV !== 'production') {
  globalForProofline.prooflineStore = prooflineStore;
}

