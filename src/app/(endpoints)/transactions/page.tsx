import type { Metadata } from 'next';
import { connection } from 'next/server';
import { amountOf, searchTransactions, TRANSACTION_SEARCH_MAX_DAYS } from '@/lib/paypal';
import { EndpointPage } from '../endpoint-page';

export const metadata: Metadata = { title: 'Transactions' };

export default async function TransactionsPage() {
  await connection();
  const end = new Date();
  const start = new Date(end.getTime() - TRANSACTION_SEARCH_MAX_DAYS * 86_400_000);
  const transactions = await searchTransactions(start, end);

  return (
    <EndpointPage
      title={`Transactions (last ${TRANSACTION_SEARCH_MAX_DAYS} days)`}
      calls={['GET /v1/reporting/transactions']}
      source="searchTransactions(start, end)"
      note="Transaction Search covers at most 31 days per request, and new activity can take up to three hours to appear. Event codes are PayPal T-codes (T0001 = payout); status is S success, P pending, D denied, V reversed or F partially refunded."
      rows={transactions.map(({ transaction_info: t, payer_info: p }) => ({
        id: t.transaction_id,
        date: t.transaction_initiation_date,
        eventCode: t.transaction_event_code,
        status: t.transaction_status,
        amount: amountOf(t.transaction_amount),
        fee: amountOf(t.fee_amount),
        endingBalance: t.ending_balance ? amountOf(t.ending_balance) : null,
        currency: t.transaction_amount?.currency_code,
        counterparty: p?.email_address,
        subject: t.transaction_subject,
        note: t.transaction_note,
        customField: t.custom_field,
      }))}
      columns={[
        { field: 'date', headerName: 'Date', cellDataType: 'dateTimeString', sort: 'desc' },
        { field: 'eventCode', headerName: 'Event code' },
        { field: 'status', headerName: 'Status' },
        { field: 'amount', headerName: 'Amount', type: 'money' },
        { field: 'fee', headerName: 'Fee', type: 'money' },
        { field: 'endingBalance', headerName: 'Ending balance', type: 'money' },
        { field: 'currency', headerName: 'Currency' },
        { field: 'counterparty', headerName: 'Counterparty' },
        { field: 'subject', headerName: 'Subject' },
        { field: 'note', headerName: 'Note' },
        { field: 'customField', headerName: 'Custom field' },
        { field: 'id', headerName: 'Transaction ID' },
      ]}
    />
  );
}
