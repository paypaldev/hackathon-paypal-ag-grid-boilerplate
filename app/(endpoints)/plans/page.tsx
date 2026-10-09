import type { Metadata } from 'next';
import { connection } from 'next/server';
import { amountOf, listPlans, type BillingCycle } from '@/lib/paypal';
import { EndpointPage } from '../endpoint-page';

export const metadata: Metadata = { title: 'Billing plans' };

// e.g. '1 MONTH', '30 DAY'
const interval = (cycle?: BillingCycle) =>
  cycle && `${cycle.frequency.interval_count} ${cycle.frequency.interval_unit}`;

export default async function PlansPage() {
  await connection();
  const plans = await listPlans();

  return (
    <EndpointPage
      title="Billing plans"
      calls={['GET /v1/billing/plans', 'GET /v1/billing/plans/{id}']}
      source="listPlans()"
      note="A plan's billing cycles hold its price: an optional TRIAL cycle followed by the REGULAR cycle that bills until cancelled."
      rows={plans.map((plan) => {
        const regular = plan.billing_cycles.find((c) => c.tenure_type === 'REGULAR');
        const trial = plan.billing_cycles.find((c) => c.tenure_type === 'TRIAL');
        const price = regular?.pricing_scheme?.fixed_price;
        return {
          id: plan.id,
          name: plan.name,
          productId: plan.product_id,
          status: plan.status,
          price: price ? amountOf(price) : null,
          billedEvery: interval(regular),
          trial: interval(trial) ?? 'None',
          setupFee: amountOf(plan.payment_preferences?.setup_fee),
          currency: price?.currency_code,
          created: plan.create_time,
        };
      })}
      columns={[
        { field: 'name', headerName: 'Name' },
        { field: 'productId', headerName: 'Product ID' },
        { field: 'status', headerName: 'Status' },
        { field: 'price', headerName: 'Price', type: 'money' },
        { field: 'billedEvery', headerName: 'Billed every' },
        { field: 'trial', headerName: 'Trial' },
        { field: 'setupFee', headerName: 'Setup fee', type: 'money' },
        { field: 'currency', headerName: 'Currency' },
        { field: 'created', headerName: 'Created', cellDataType: 'dateTimeString' },
        { field: 'id', headerName: 'Plan ID' },
      ]}
    />
  );
}
