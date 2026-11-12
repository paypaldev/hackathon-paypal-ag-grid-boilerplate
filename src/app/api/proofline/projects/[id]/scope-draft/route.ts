import { NextRequest, NextResponse } from 'next/server';
import { extractScopeFromSource } from '@/lib/proofline/scope-agent';
import { prooflineStore } from '@/lib/proofline/store';
import type { SourceDocument } from '@/lib/proofline/types';

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

    const body = await req.json();
    const { rawText, sourceType = 'CLIENT_CHAT', submittedBy = project.clientName || 'Client' } = body;

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    const docId = `src-doc-${Date.now().toString(36)}`;
    const sourceDoc: SourceDocument = {
      id: docId,
      projectId,
      sourceType,
      rawText,
      submittedBy,
      createdAt: new Date().toISOString(),
    };

    project.sourceDocuments.push(sourceDoc);

    const draftResult = await extractScopeFromSource(rawText, docId);

    prooflineStore.appendAuditEntry(
      projectId,
      submittedBy,
      'CLIENT',
      'SOURCE_DOCUMENT_INGESTED',
      'SCOPE_VERSION',
      docId,
      'CLIENT_CLAIM',
      { preview: rawText.slice(0, 100), docId }
    );

    return NextResponse.json({
      success: true,
      draft: draftResult.content,
      evidence: draftResult.evidence,
      sourceDocument: sourceDoc,
      modelUsed: draftResult.extractedWithModel,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

