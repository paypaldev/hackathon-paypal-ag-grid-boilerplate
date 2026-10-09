import type { Metadata } from 'next';
import { connection } from 'next/server';
import { amountOf, getBalances } from '@/lib/paypal';
import { EndpointPage } from '../endpoint-page';

export const metadata: Metadata = { title: 'Balances' };

export default async function BalancesPage() {
  await connection();
  const { as_of_time, balances = [] } = await getBalances();

  return (
    <EndpointPage
      title="Balances"
      calls={['GET /v1/reporting/balances']}
      source="getBalances()"
      note={`The account's balance in each currency it holds${as_of_time ? `, as of ${as_of_time}` : ''}.`}
      rows={balances.map((b) => ({
        currency: b.currency,
        total: amountOf(b.total_balance),
        available: amountOf(b.available_balance),
        withheld: amountOf(b.withheld_balance),
      }))}
      columns={[
        { field: 'currency', headerName: 'Currency' },
        { field: 'total', headerName: 'Total', type: 'money' },
        { field: 'available', headerName: 'Available', type: 'money' },
        { field: 'withheld', headerName: 'Withheld', type: 'money' },
      ]}
    />
  );
}
