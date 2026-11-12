import { NextRequest, NextResponse } from 'next/server';
import { getPayPalOrderDetails } from '@/lib/paypal';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: "Missing required query parameter: id" }, { status: 400 });
    }

    const details = await getPayPalOrderDetails(orderId);
    return NextResponse.json({
      success: true,
      orderId,
      details,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

