import { NextRequest, NextResponse } from 'next/server';
import { prooflineStore } from '@/lib/proofline/store';
import type { CurrencyCode, Project } from '@/lib/proofline/types';

export async function GET() {
  const projects = Array.from(prooflineStore.projects.values());
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title = 'New Client Milestone Project',
      clientEmail = 'client@example.com',
      clientName = 'Client',
      freelancerName = 'Freelancer',
      currency = 'USD' as CurrencyCode,
    } = body;

    const projectId = `proj-${Date.now().toString(36)}`;
    const newProject: Project = {
      id: projectId,
      ownerId: 'usr-freelancer',
      clientEmail,
      clientName,
      freelancerName,
      title,
      currency,
      status: 'DRAFT',
      activeScopeVersionId: null,
      sourceDocuments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    prooflineStore.projects.set(projectId, newProject);
    prooflineStore.appendAuditEntry(
      projectId,
      freelancerName,
      'FREELANCER',
      'PROJECT_CREATED',
      'SCOPE_VERSION',
      projectId,
      'FREELANCER_STATEMENT',
      { title, clientEmail, currency }
    );

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

