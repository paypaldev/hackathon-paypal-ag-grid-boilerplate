import { NextResponse } from 'next/server';
import { getSystemHealth, markServiceAvailable, resyncAllServices } from '@/lib/system-health';

export async function GET() {
  try {
    const services = getSystemHealth();
    const allOperational = services.every((s) => s.status === 'OPERATIONAL' || s.status === 'SIMULATED');
    return NextResponse.json({
      overallStatus: allOperational ? 'HEALTHY' : 'DEGRADED',
      checkedAt: new Date().toISOString(),
      services,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Health check failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'mark-available') {
      const { serviceId } = body;
      const updated = markServiceAvailable(serviceId);
      return NextResponse.json({ success: true, service: updated });
    }

    if (action === 'resync') {
      const refreshed = resyncAllServices();
      return NextResponse.json({ success: true, services: refreshed });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
