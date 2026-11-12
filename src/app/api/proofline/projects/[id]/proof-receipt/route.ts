import { NextRequest, NextResponse } from 'next/server';
import { compileProofReceipt, verifyAuditChainIntegrity } from '@/lib/proofline/proof-receipt-service';
import { prooflineStore } from '@/lib/proofline/store';
import type { ClientDecision, Deliverable } from '@/lib/proofline/types';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const project = prooflineStore.projects.get(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const versions = prooflineStore.scopeVersions.get(projectId) || [];
    const activeScope = versions.find((v) => v.id === project.activeScopeVersionId) || versions[versions.length - 1] || null;
    const changeOrders = prooflineStore.changeOrders.get(projectId) || [];
    const auditEntries = prooflineStore.auditTrails.get(projectId) || [];

    // Gather deliverables & decisions across all milestones
    const deliverables: Deliverable[] = [];
    const decisions: ClientDecision[] = [];
    if (activeScope?.content?.milestones) {
      for (const m of activeScope.content.milestones) {
        deliverables.push(...(prooflineStore.deliverables.get(m.id) || []));
        decisions.push(...(prooflineStore.decisions.get(m.id) || []));
      }
    }

    const invoices = Array.from(prooflineStore.invoices.values()).filter((i) => i.projectId === projectId);

    const receipt = compileProofReceipt({
      project,
      scopeVersion: activeScope,
      changeOrders,
      deliverables,
      invoices,
      decisions,
      auditEntries,
    });

    const chainIntegrity = verifyAuditChainIntegrity(auditEntries);

    return NextResponse.json({
      success: true,
      receipt,
      chainIntegrity,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

