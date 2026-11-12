import { NextResponse } from 'next/server';
import { getTraces, updateTraceFeedback, type LangfuseToolType } from '@/lib/langfuse-tracer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tool = searchParams.get('tool') as LangfuseToolType | null;

    const traces = getTraces(tool || undefined);
    return NextResponse.json({
      totalCount: traces.length,
      traces,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch traces' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { traceId, feedback } = body;

    if (!traceId || !feedback) {
      return NextResponse.json({ error: 'traceId and feedback are required' }, { status: 400 });
    }

    const updated = updateTraceFeedback(traceId, feedback);
    if (!updated) {
      return NextResponse.json({ error: 'Trace not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, trace: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update trace feedback' }, { status: 500 });
  }
}

