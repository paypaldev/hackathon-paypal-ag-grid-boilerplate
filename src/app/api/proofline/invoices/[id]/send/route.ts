import { NextRequest, NextResponse } from 'next/server';
import { sendPayPalInvoiceOnSandbox } from '@/lib/proofline/paypal-invoicing-adapter';
import { prooflineStore } from '@/lib/proofline/store';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await context.params;
    const invoice = prooflineStore.invoices.get(invoiceId);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.providerInvoiceId) {
      return NextResponse.json({ error: 'Invoice has no provider invoice ID to dispatch' }, { status: 400 });
    }

    const adapterRes = await sendPayPalInvoiceOnSandbox(invoice.providerInvoiceId);
    if (!adapterRes.success) {
      return NextResponse.json({
        error: adapterRes.error || 'Failed to dispatch PayPal invoice',
        paypalDebugId: adapterRes.paypalDebugId,
      }, { status: 502 });
    }

    invoice.status = 'SENT';
    invoice.lastReadbackAt = new Date().toISOString();
    invoice.readbackRawStatus = adapterRes.rawStatus || 'SENT';

    prooflineStore.appendAuditEntry(
      invoice.projectId,
      'PayPal Invoicing API',
      'SYSTEM',
      'INVOICE_SENT_TO_CLIENT',
      'INVOICE',
      invoice.id,
      'PAYPAL_CONFIRMED',
      {
        providerInvoiceId: invoice.providerInvoiceId,
        recipientEmail: invoice.recipientEmail,
        status: invoice.status,
      }
    );

    return NextResponse.json({
      success: true,
      invoice,
      adapter: adapterRes,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

