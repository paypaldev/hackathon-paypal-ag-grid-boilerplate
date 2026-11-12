import { NextRequest, NextResponse } from 'next/server';
import { prooflineStore } from '@/lib/proofline/store';
import type { ClientDecision, Deliverable } from '@/lib/proofline/types';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  const project = prooflineStore.projects.get(projectId);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const versions = prooflineStore.scopeVersions.get(projectId) || [];
  const activeScope = versions.find((v) => v.id === project.activeScopeVersionId) || versions[versions.length - 1] || null;
  const changeOrders = prooflineStore.changeOrders.get(projectId) || [];
  const auditEntries = prooflineStore.auditTrails.get(projectId) || [];

  // Gather deliverables & decisions for milestones
  const deliverables: Record<string, Deliverable[]> = {};
  const decisions: Record<string, ClientDecision[]> = {};
  if (activeScope?.content?.milestones) {
    for (const m of activeScope.content.milestones) {
      deliverables[m.id] = prooflineStore.deliverables.get(m.id) || [];
      decisions[m.id] = prooflineStore.decisions.get(m.id) || [];
    }
  }

  // Gather project invoices
  const invoices = Array.from(prooflineStore.invoices.values()).filter((i) => i.projectId === projectId);

  return NextResponse.json({
    project,
    activeScope,
    allScopeVersions: versions,
    changeOrders,
    deliverables,
    decisions,
    invoices,
    auditTrail: auditEntries,
  });
}

