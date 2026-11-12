import { NextRequest, NextResponse } from 'next/server';
import { computeSha256 } from '@/lib/proofline/crypto';
import { validateScopeVersionFreshness } from '@/lib/proofline/policy-engine';
import { prooflineStore } from '@/lib/proofline/store';
import type { ScopeContent, ScopeFieldEvidence, ScopeVersion } from '@/lib/proofline/types';

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
    const {
      content,
      evidence = [],
      acceptedBy = null,
      expectedBaseSha256 = null,
    }: {
      content: ScopeContent;
      evidence?: ScopeFieldEvidence[];
      acceptedBy?: string | null;
      expectedBaseSha256?: string | null;
    } = body;

    if (!content || !content.projectGoal) {
      return NextResponse.json({ error: 'Valid ScopeContent is required' }, { status: 400 });
    }

    const existingVersions = prooflineStore.scopeVersions.get(projectId) || [];
    const latestVersion = existingVersions[existingVersions.length - 1] || null;

    // Check for stale hash if expectedBaseSha256 is supplied
    if (expectedBaseSha256) {
      const freshness = validateScopeVersionFreshness(expectedBaseSha256, latestVersion);
      if (!freshness.valid) {
        return NextResponse.json({ error: freshness.reason }, { status: 409 });
      }
    }

    // Compute cryptographic SHA-256 digest of canonical content
    const contentSha256 = computeSha256(content);
    const nextVersionNum = existingVersions.length + 1;
    const versionId = `scope-v${nextVersionNum}-${contentSha256.slice(0, 8)}`;

    const newScopeVersion: ScopeVersion = {
      id: versionId,
      projectId,
      versionNumber: nextVersionNum,
      status: acceptedBy ? 'ACCEPTED' : 'PROPOSED',
      content,
      evidence,
      contentSha256,
      createdBy: project.freelancerName || 'Freelancer',
      acceptedBy: acceptedBy || null,
      acceptedAt: acceptedBy ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };

    // If accepted, supersede old versions
    if (acceptedBy) {
      existingVersions.forEach((v) => {
        if (v.status === 'ACCEPTED') v.status = 'SUPERSEDED';
      });
      project.activeScopeVersionId = versionId;
      project.status = 'ACTIVE';
    }

    existingVersions.push(newScopeVersion);
    prooflineStore.scopeVersions.set(projectId, existingVersions);

    prooflineStore.appendAuditEntry(
      projectId,
      acceptedBy || project.freelancerName || 'Freelancer',
      acceptedBy ? 'CLIENT' : 'FREELANCER',
      acceptedBy ? 'SCOPE_VERSION_ACCEPTED' : 'SCOPE_VERSION_PROPOSED',
      'SCOPE_VERSION',
      versionId,
      acceptedBy ? 'FREELANCER_STATEMENT' : 'FREELANCER_STATEMENT',
      { version: nextVersionNum, sha256: contentSha256, acceptedBy }
    );

    return NextResponse.json({
      success: true,
      scopeVersion: newScopeVersion,
    }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

