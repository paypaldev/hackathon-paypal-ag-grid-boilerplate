import { NextRequest, NextResponse } from 'next/server';
import { processDeliverableUpload } from '@/lib/proofline/delivery-service';
import { prooflineStore } from '@/lib/proofline/store';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: milestoneId } = await context.params;
    const body = await req.json();

    const {
      filename = 'deliverable.zip',
      mediaType = 'application/zip',
      fileContent = 'Proofline delivery artifact binary stream',
      uploadedBy = 'Freelancer',
      criteria = [],
      projectId,
    } = body;

    const deliverable = await processDeliverableUpload({
      milestoneId,
      filename,
      mediaType,
      fileBuffer: Buffer.from(fileContent),
      uploadedBy,
      milestoneCriteria: criteria,
    });

    const list = prooflineStore.deliverables.get(milestoneId) || [];
    list.push(deliverable);
    prooflineStore.deliverables.set(milestoneId, list);

    if (projectId) {
      prooflineStore.appendAuditEntry(
        projectId,
        uploadedBy,
        'FREELANCER',
        'DELIVERABLE_SUBMITTED',
        'DELIVERABLE',
        deliverable.id,
        'SYSTEM_CHECK',
        {
          filename: deliverable.filename,
          sha256: deliverable.sha256,
          byteSize: deliverable.byteSize,
          checksCount: deliverable.checks.length,
        }
      );
    }

    return NextResponse.json({
      success: true,
      deliverable,
    }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

