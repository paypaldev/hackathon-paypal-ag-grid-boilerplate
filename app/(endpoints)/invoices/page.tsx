import type { Metadata } from 'next';
import { connection } from 'next/server';
import { amountOf, listInvoices } from '@/lib/paypal';
import { EndpointPage } from '../endpoint-page';

export const metadata: Metadata = { title: 'Invoices' };

export default async function InvoicesPage() {
  await connection();
  const invoices = await listInvoices();

  return (
    <EndpointPage
      title="Invoices"
      calls={['GET /v2/invoicing/invoices', 'GET /v2/invoicing/invoices/{id}']}
      source="listInvoices()"
      note="The list endpoint omits line items, payments and refunds, so each invoice is then fetched in full. Amounts are in the invoice's own currency."
      rows={invoices.map((inv) => {
        const recipient = inv.primary_recipients?.[0]?.billing_info;
        return {
          id: inv.id,
          number: inv.detail.invoice_number,
          status: inv.status,
          recipient: recipient?.business_name ?? recipient?.name?.full_name,
          email: recipient?.email_address,
          invoiceDate: inv.detail.invoice_date,
          dueDate: inv.detail.payment_term?.due_date,
          total: amountOf(inv.amount),
          paid: amountOf(inv.payments?.paid_amount),
          due: amountOf(inv.due_amount),
          lineItems: inv.items?.length ?? 0,
          currency: inv.detail.currency_code,
        };
      })}
      columns={[
        { field: 'number', headerName: 'Invoice' },
        { field: 'status', headerName: 'Status' },
        { field: 'recipient', headerName: 'Recipient' },
        { field: 'email', headerName: 'Email' },
        { field: 'invoiceDate', headerName: 'Invoice date', cellDataType: 'dateString' },
        { field: 'dueDate', headerName: 'Due date', cellDataType: 'dateString' },
        { field: 'total', headerName: 'Total', type: 'money' },
        { field: 'paid', headerName: 'Paid', type: 'money' },
        { field: 'due', headerName: 'Due', type: 'money' },
        { field: 'lineItems', headerName: 'Line items' },
        { field: 'currency', headerName: 'Currency' },
        { field: 'id', headerName: 'Invoice ID' },
      ]}
    />
  );
}
