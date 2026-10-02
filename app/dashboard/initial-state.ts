import type { AgReportState } from 'ag-studio';

// The dashboard Studio opens with. The canvas is 24 columns wide with 16px rows.

const title = (text: string) => ({ title: { enabled: true, text } });

const kpi = (text: string, id: string, aggregation: 'sum' | 'avg' | 'count' | 'countd') => ({
  type: 'value' as const,
  format: title(text),
  dataMapping: { value: [{ id, aggregation }] },
});

const at = (xTrack: number, yTrack: number, xSpan: number, ySpan: number) => ({ xTrack, yTrack, xSpan, ySpan });

export const initialState: AgReportState = {
  version: '3.0.0',
  selectedPageId: 'plans',
  pages: [
    {
      id: 'plans',
      widgets: {
        products: kpi('Products', 'products.id', 'countd'),
        plans: kpi('Billing Plans', 'plans.id', 'countd'),
        avgMonthlyPrice: kpi('Avg Monthly Price', 'plans.monthlyPrice', 'avg'),
        avgTrialDays: kpi('Avg Trial Days', 'plans.trialDays', 'avg'),
        productFilter: {
          type: 'button-filter',
          format: title('Product'),
          dataMapping: { value: [{ id: 'products.name' }] },
        },
        statusFilter: {
          type: 'button-filter',
          format: title('Plan Status'),
          dataMapping: { value: [{ id: 'plans.status' }] },
        },
        monthlyPriceByPlan: {
          type: 'bar-chart-grouped',
          format: {
            ...title('Monthly Price by Plan'),
            subtitle: { enabled: true, text: 'Price normalised to a month, so weekly and annual plans compare' },
          },
          dataMapping: {
            categoryKey: [{ id: 'plans.name' }],
            valueKey: [{ id: 'plans.monthlyPrice', aggregation: 'sum' }],
          },
          sort: [{ field: { id: 'plans.monthlyPrice', aggregation: 'sum' }, direction: 'desc' }],
        },
        plansByProduct: {
          type: 'pivot-grid',
          format: {
            ...title('Plans by Product and Billing Interval'),
            subtitle: { enabled: true, text: 'Which billing intervals each product offers' },
            style: { totalColumns: true, grandTotalRow: { enabled: true } },
          },
          dataMapping: {
            rows: [{ id: 'products.name' }],
            columns: [{ id: 'plans.billingInterval' }],
            values: [{ id: 'planCount' }],
          },
        },
        avgPriceByProduct: {
          type: 'column-chart-grouped',
          format: title('Avg Monthly Price by Product'),
          dataMapping: {
            categoryKey: [{ id: 'products.name' }],
            valueKey: [{ id: 'plans.monthlyPrice', aggregation: 'avg' }],
          },
          sort: [{ field: { id: 'plans.monthlyPrice', aggregation: 'avg' }, direction: 'desc' }],
        },
        planGrid: {
          type: 'grid',
          format: title('Plan Catalogue'),
          dataMapping: {
            cols: [
              { id: 'products.name' },
              { id: 'plans.name' },
              { id: 'plans.status' },
              { id: 'plans.billingInterval' },
              { id: 'plans.price' },
              { id: 'plans.monthlyPrice' },
              { id: 'plans.trialDays' },
              { id: 'plans.setupFee' },
            ],
          },
        },
      },
      widgetLayout: {
        products: at(0, 0, 6, 6),
        plans: at(6, 0, 6, 6),
        avgMonthlyPrice: at(12, 0, 6, 6),
        avgTrialDays: at(18, 0, 6, 6),
        productFilter: at(0, 6, 15, 8),
        statusFilter: at(15, 6, 9, 8),
        monthlyPriceByPlan: at(0, 14, 12, 28),
        avgPriceByProduct: at(12, 14, 12, 28),
        plansByProduct: at(0, 42, 24, 18),
        planGrid: at(0, 60, 24, 34),
      },
    },
    {
      id: 'payouts',
      widgets: {
        available: kpi('Available Balance', 'balances.available', 'sum'),
        paidOut: kpi('Total Paid Out', 'payouts.amount', 'sum'),
        fees: kpi('Payout Fees', 'payouts.fee', 'sum'),
        recipients: kpi('Recipients', 'payouts.recipient', 'countd'),
        categoryFilter: {
          type: 'button-filter',
          format: title('Payout Category'),
          dataMapping: { value: [{ id: 'payouts.category' }] },
        },
        paidByCategory: {
          type: 'donut-chart',
          format: title('Paid Out by Category'),
          dataMapping: {
            categoryKey: [{ id: 'payouts.category' }],
            valueKey: [{ id: 'payouts.amount', aggregation: 'sum' }],
          },
        },
        paidByRecipient: {
          type: 'bar-chart-grouped',
          format: title('Paid Out by Recipient'),
          dataMapping: {
            categoryKey: [{ id: 'payouts.recipient' }],
            valueKey: [{ id: 'payouts.amount', aggregation: 'sum' }],
          },
          sort: [{ field: { id: 'payouts.amount', aggregation: 'sum' }, direction: 'desc' }],
        },
        payoutGrid: {
          type: 'grid',
          format: title('Payouts'),
          dataMapping: {
            cols: [
              { id: 'payouts.date' },
              { id: 'payouts.category' },
              { id: 'payouts.recipient' },
              { id: 'payouts.subject' },
              { id: 'payouts.status' },
              { id: 'payouts.amount' },
              { id: 'payouts.fee' },
            ],
          },
        },
      },
      widgetLayout: {
        available: at(0, 0, 6, 6),
        paidOut: at(6, 0, 6, 6),
        fees: at(12, 0, 6, 6),
        recipients: at(18, 0, 6, 6),
        categoryFilter: at(0, 6, 24, 8),
        paidByCategory: at(0, 14, 10, 20),
        paidByRecipient: at(10, 14, 14, 20),
        payoutGrid: at(0, 34, 24, 20),
      },
    },
  ],
};
