import { NextRequest, NextResponse } from 'next/server';
import { analyzeChangeRequest } from '@/lib/proofline/change-agent';
import { prooflineStore } from '@/lib/proofline/store';
import type { ChangeOrder } from '@/lib/proofline/types';

export async function POST(
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
    const baseScope = versions.find((v) => v.id === project.activeScopeVersionId) || versions[versions.length - 1];

    if (!baseScope) {
      return NextResponse.json({ error: 'Cannot evaluate scope change without an accepted base scope' }, { status: 400 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const analysis = await analyzeChangeRequest(message, baseScope);

    const changeOrderId = `co-${Date.now().toString(36)}`;
    const changeOrder: ChangeOrder = {
      id: changeOrderId,
      projectId,
      baseScopeVersionId: baseScope.id,
      baseScopeSha256: baseScope.contentSha256,
      incomingMessage: message,
      classification: analysis.classification,
      confidence: analysis.confidence,
      delta: analysis.delta,
      status: 'PROPOSED',
      isProposal: true,
      proposedBy: 'Proofline Change-Order Agent',
      createdAt: new Date().toISOString(),
    };

    const list = prooflineStore.changeOrders.get(projectId) || [];
    list.push(changeOrder);
    prooflineStore.changeOrders.set(projectId, list);

    prooflineStore.appendAuditEntry(
      projectId,
      'Proofline Change Agent',
      'SYSTEM',
      'SCOPE_CHANGE_ANALYZED',
      'CHANGE_ORDER',
      changeOrderId,
      'AI_INFERENCE',
      { classification: analysis.classification, confidence: analysis.confidence, delta: analysis.delta }
    );

    return NextResponse.json({
      success: true,
      analysis,
      changeOrder,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

