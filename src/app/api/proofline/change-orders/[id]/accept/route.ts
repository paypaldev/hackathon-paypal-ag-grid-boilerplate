import { NextRequest, NextResponse } from 'next/server';
import { computeSha256 } from '@/lib/proofline/crypto';
import { validateScopeVersionFreshness } from '@/lib/proofline/policy-engine';
import { prooflineStore } from '@/lib/proofline/store';
import type { ChangeOrder, ScopeContent, ScopeDeliverable, ScopeMilestone, ScopeVersion } from '@/lib/proofline/types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: changeOrderId } = await context.params;

    // Search across projects for this change order
    let targetCo: ChangeOrder | null = null;
    let targetProjectId: string | null = null;

    for (const [pId, cos] of prooflineStore.changeOrders.entries()) {
      const found = cos.find((c) => c.id === changeOrderId);
      if (found) {
        targetCo = found;
        targetProjectId = pId;
        break;
      }
    }

    if (!targetCo || !targetProjectId) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    const body = await req.json();
    const { acceptedBy = 'Client', expectedBaseSha256 } = body;

    const project = prooflineStore.projects.get(targetProjectId)!;
    const existingVersions = prooflineStore.scopeVersions.get(targetProjectId) || [];
    const baseScope = existingVersions.find((v) => v.id === targetCo.baseScopeVersionId);

    if (!baseScope) {
      return NextResponse.json({ error: 'Base scope version not found' }, { status: 404 });
    }

    // Freshness check: reject stale hash
    const freshness = validateScopeVersionFreshness(
      expectedBaseSha256 || targetCo.baseScopeSha256,
      existingVersions[existingVersions.length - 1]
    );
    if (!freshness.valid) {
      return NextResponse.json({ error: freshness.reason }, { status: 409 });
    }

    // Incorporate change order delta into new ScopeContent
    const baseContent = baseScope.content;
    const delta = targetCo.delta;

    const addedDeliverables: ScopeDeliverable[] = delta?.deliverablesAdded || [];
    const priceDeltaMinor = delta?.suggestedPriceDeltaMinor || 0;
    const newTotalMinor = (baseContent.totalAmountMinor || 0) + priceDeltaMinor;

    const newMilestoneId = `m-${baseContent.milestones.length + 1}`;
    const newMilestone: ScopeMilestone = {
      id: newMilestoneId,
      title: `Change Order Addendum: ${addedDeliverables[0]?.title || 'Additional Deliverables'}`,
      amountMinor: priceDeltaMinor,
      currency: baseContent.currency,
      dueAt: null,
      deliverableIds: addedDeliverables.map((d: ScopeDeliverable) => d.id),
      status: 'PENDING',
    };

    const newContent: ScopeContent = {
      ...baseContent,
      deliverables: [...baseContent.deliverables, ...addedDeliverables],
      milestones: [...baseContent.milestones, newMilestone],
      totalAmountMinor: newTotalMinor,
      assumptions: [
        ...baseContent.assumptions,
        `Includes approved change order (${targetCo.id}): +$${(priceDeltaMinor / 100).toFixed(2)}`,
      ],
    };

    const newSha = computeSha256(newContent);
    const nextVersionNum = existingVersions.length + 1;
    const newVersionId = `scope-v${nextVersionNum}-${newSha.slice(0, 8)}`;

    const newScopeVersion: ScopeVersion = {
      id: newVersionId,
      projectId: targetProjectId,
      versionNumber: nextVersionNum,
      status: 'ACCEPTED',
      content: newContent,
      evidence: [
        ...baseScope.evidence,
        {
          id: `ev-co-${changeOrderId}`,
          fieldPath: `milestones[${baseContent.milestones.length}].amountMinor`,
          confidence: 1.0,
          needsConfirmation: false,
          notes: `Created from accepted Change Order ${changeOrderId}`,
        },
      ],
      contentSha256: newSha,
      createdBy: project.freelancerName || 'Freelancer',
      acceptedBy,
      acceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Mark previous versions superseded
    existingVersions.forEach((v) => {
      if (v.status === 'ACCEPTED') v.status = 'SUPERSEDED';
    });

    existingVersions.push(newScopeVersion);
    prooflineStore.scopeVersions.set(targetProjectId, existingVersions);

    // Update Change Order
    targetCo.status = 'ACCEPTED';
    targetCo.acceptedScopeVersionId = newVersionId;
    targetCo.reviewedBy = acceptedBy;
    targetCo.reviewedAt = new Date().toISOString();

    // Update active project scope
    project.activeScopeVersionId = newVersionId;
    project.updatedAt = new Date().toISOString();

    prooflineStore.appendAuditEntry(
      targetProjectId,
      acceptedBy,
      'CLIENT',
      'CHANGE_ORDER_ACCEPTED_AND_NEW_SCOPE_FROZEN',
      'CHANGE_ORDER',
      changeOrderId,
      'CLIENT_CLAIM',
      {
        changeOrderId,
        previousScopeVersion: baseScope.versionNumber,
        newScopeVersion: nextVersionNum,
        newScopeSha256: newSha,
        priceDeltaMinor,
      }
    );

    return NextResponse.json({
      success: true,
      changeOrder: targetCo,
      newScopeVersion,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

