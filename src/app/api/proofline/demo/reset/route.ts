import { NextResponse } from 'next/server';
import { prooflineStore } from '@/lib/proofline/store';

export async function POST() {
  prooflineStore.seedDemoState();
  return NextResponse.json({
    success: true,
    message: 'Proofline store reset to clean seeded demo state',
    projectId: 'proj-crossborder-demo',
  });
}

