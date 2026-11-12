import { NextRequest, NextResponse } from 'next/server';
import { readbackPayPalInvoice } from '@/lib/proofline/paypal-invoicing-adapter';
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
      return NextResponse.json({ error: 'Invoice has no PayPal provider invoice ID' }, { status: 400 });
    }

    // Server-side authoritative readback from PayPal
    const readback = await readbackPayPalInvoice(invoice.providerInvoiceId);

    invoice.lastReadbackAt = new Date().toISOString();
    invoice.readbackRawStatus = readback.rawStatus;

    if (readback.success) {
      invoice.status = readback.status;
      if (readback.status === 'PAID') {
        invoice.paidAt = new Date().toISOString();
      }
    }

    prooflineStore.appendAuditEntry(
      invoice.projectId,
      'PayPal Invoicing API Readback',
      'SYSTEM',
      'INVOICE_RECONCILED_WITH_PAYPAL',
      'INVOICE',
      invoice.id,
      'PAYPAL_CONFIRMED',
      {
        providerInvoiceId: invoice.providerInvoiceId,
        status: invoice.status,
        rawStatus: readback.rawStatus,
        paidAt: invoice.paidAt,
        simulated: readback.simulated,
      }
    );

    return NextResponse.json({
      success: true,
      invoice,
      readback,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

