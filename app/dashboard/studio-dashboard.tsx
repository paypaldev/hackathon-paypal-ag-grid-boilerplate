'use client';

import { useMemo } from 'react';
import { createFormats, enableStudioDevValidations, type AgDataSourcesDefinition, type AgRelationDefinition } from 'ag-studio';
import { AgStudio, AgStudioProvider } from 'ag-studio-react';
import type { DashboardData } from '@/lib/dashboard';
import { initialState } from './initial-state';

if (process.env.NODE_ENV !== 'production') {
  enableStudioDevValidations();
}

// Foreign key 'table.field' -> primary key 'table.field'.
const manyToOne = (id: string, source: string, target: string): AgRelationDefinition => {
  const [sourceTable, sourceField] = source.split('.');
  const [targetTable, targetField] = target.split('.');
  return {
    id,
    source: { tableId: sourceTable, fieldId: sourceField },
    target: { tableId: targetTable, fieldId: targetField },
    type: 'many-to-one',
  };
};

function buildData(data: DashboardData): AgDataSourcesDefinition {
  return {
    description:
      'PayPal sandbox data for a subscription business: the billing plan catalogue, and the account ledger of payout batches, payouts and balances.',
    sources: [
      {
        id: 'products',
        description: 'Subscription products. Each product has several billing plans.',
        data: data.products,
        fields: [
          { id: 'id', name: 'Product ID', format: 'textFormat' },
          { id: 'name', name: 'Product', format: 'textFormat' },
        ],
      },
      {
        id: 'plans',
        name: 'Billing Plans',
        description: 'Subscription billing plans. Price is per billing interval; monthly price normalises it to a month.',
        data: data.plans,
        fields: [
          { id: 'id', name: 'Plan ID', format: 'textFormat' },
          { id: 'productId', name: 'Product ID', format: 'textFormat', hide: true },
          { id: 'name', name: 'Plan', format: 'textFormat' },
          { id: 'status', name: 'Plan Status', format: 'textFormat' },
          { id: 'price', name: 'Price', format: 'currencyFormat' },
          { id: 'billingInterval', name: 'Billed Every', format: 'textFormat' },
          { id: 'monthlyPrice', name: 'Monthly Price', format: 'currencyFormat' },
          { id: 'trialDays', name: 'Trial Days', format: 'integerFormat' },
          { id: 'setupFee', name: 'Setup Fee', format: 'currencyFormat' },
          { id: 'paymentFailureThreshold', name: 'Payment Failure Threshold', format: 'integerFormat' },
          { id: 'createTime', name: 'Plan Created', format: 'dateTimeFormat' },
        ],
      },
      {
        id: 'billingCycles',
        name: 'Billing Cycles',
        description: 'The ordered billing cycles of each plan: an optional TRIAL cycle followed by the REGULAR cycle. Total cycles 0 means it bills until cancelled.',
        data: data.billingCycles,
        fields: [
          { id: 'id', name: 'Cycle ID', format: 'textFormat', hide: true },
          { id: 'planId', name: 'Plan ID', format: 'textFormat', hide: true },
          { id: 'sequence', name: 'Sequence', format: 'integerFormat' },
          { id: 'tenureType', name: 'Tenure Type', format: 'textFormat' },
          { id: 'intervalUnit', name: 'Interval Unit', format: 'textFormat' },
          { id: 'intervalCount', name: 'Interval Count', format: 'integerFormat' },
          { id: 'totalCycles', name: 'Total Cycles', format: 'integerFormat' },
          { id: 'price', name: 'Cycle Price', format: 'currencyFormat' },
        ],
      },
      {
        id: 'transactions',
        description:
          'Every account ledger entry from the last 30 days. A payout batch places one Hold on the balance; each Payout in the batch has a matching Hold released entry.',
        data: data.transactions,
        fields: [
          { id: 'id', name: 'Transaction ID', format: 'textFormat' },
          { id: 'batchId', name: 'Batch ID', format: 'textFormat', hide: true },
          { id: 'date', name: 'Date', format: 'dateTimeFormat' },
          { id: 'eventCode', name: 'Event Code', format: 'textFormat' },
          { id: 'eventType', name: 'Event Type', format: 'textFormat' },
          { id: 'status', name: 'Status', format: 'textFormat' },
          { id: 'currency', name: 'Currency', format: 'textFormat', hide: true },
          { id: 'amount', name: 'Amount', format: 'currencyFormat' },
          { id: 'fee', name: 'Fee', format: 'currencyFormat' },
          { id: 'endingBalance', name: 'Ending Balance', format: 'currencyFormat' },
          { id: 'counterparty', name: 'Counterparty', format: 'textFormat' },
          { id: 'subject', name: 'Subject', format: 'textFormat' },
          { id: 'note', name: 'Note', format: 'textFormat' },
          { id: 'reference', name: 'Reference', format: 'textFormat' },
        ],
      },
      {
        id: 'payouts',
        description: 'Individual payouts to recipients, as positive amounts. Each belongs to one payout batch.',
        data: data.payouts,
        fields: [
          { id: 'id', name: 'Payout ID', format: 'textFormat' },
          { id: 'batchId', name: 'Batch ID', format: 'textFormat', hide: true },
          { id: 'reference', name: 'Payout Reference', format: 'textFormat' },
          { id: 'category', name: 'Payout Category', format: 'textFormat' },
          { id: 'recipient', name: 'Recipient', format: 'textFormat' },
          { id: 'date', name: 'Payout Date', format: 'dateTimeFormat' },
          { id: 'status', name: 'Payout Status', format: 'textFormat' },
          { id: 'amount', name: 'Payout Amount', format: 'currencyFormat' },
          { id: 'fee', name: 'Payout Fee', format: 'currencyFormat' },
          { id: 'subject', name: 'Payout Subject', format: 'textFormat' },
          { id: 'note', name: 'Payout Note', format: 'textFormat' },
        ],
      },
      {
        id: 'payoutBatches',
        name: 'Payout Batches',
        description: 'Payout batches. Held amount is the total (payouts plus fees) held from the balance for the batch.',
        data: data.payoutBatches,
        fields: [
          { id: 'id', name: 'Batch ID', format: 'textFormat' },
          { id: 'category', name: 'Batch Category', format: 'textFormat' },
          { id: 'date', name: 'Batch Date', format: 'dateTimeFormat' },
          { id: 'currency', name: 'Batch Currency', format: 'textFormat', hide: true },
          { id: 'heldAmount', name: 'Held Amount', format: 'currencyFormat' },
          { id: 'payoutCount', name: 'Payout Count', format: 'integerFormat' },
        ],
      },
      {
        id: 'balances',
        description: 'Current account balance per currency.',
        data: data.balances,
        fields: [
          { id: 'currency', name: 'Currency', format: 'textFormat' },
          { id: 'total', name: 'Total Balance', format: 'currencyFormat' },
          { id: 'available', name: 'Available Balance', format: 'currencyFormat' },
          { id: 'withheld', name: 'Withheld Balance', format: 'currencyFormat' },
          { id: 'asOf', name: 'Balance As Of', format: 'dateTimeFormat' },
        ],
      },
    ],
    expressions: [
      // A count with a readable name, rather than 'Plan ID (countd)', for widget headers.
      { id: 'planCount', name: 'Plans', isMeasure: true, format: 'integerFormat', expression: { id: 'plans.id', aggregation: 'countd' } },
    ],
    relationships: [
      manyToOne('plan-product', 'plans.productId', 'products.id'),
      manyToOne('cycle-plan', 'billingCycles.planId', 'plans.id'),
      manyToOne('payout-batch', 'payouts.batchId', 'payoutBatches.id'),
      manyToOne('transaction-batch', 'transactions.batchId', 'payoutBatches.id'),
      manyToOne('transaction-balance', 'transactions.currency', 'balances.currency'),
    ],
    // All sandbox amounts are USD; currencyFormat has no currency code of its own.
    formats: createFormats({ overrides: { currencyFormat: { formatOptions: { format: '$#,##0.00' } } } }),
  };
}

export function StudioDashboard({ data, licenseKey }: { data: DashboardData; licenseKey?: string }) {
  const studioData = useMemo(() => buildData(data), [data]);

  return (
    <AgStudioProvider licenseKey={licenseKey}>
      <AgStudio data={studioData} initialState={initialState} mode="edit" style={{ height: '100vh', width: '100%' }} />
    </AgStudioProvider>
  );
}
