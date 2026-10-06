// The REST dashboard's initial AG Studio report. Field references are '<source>.<field>' from
// ./data.ts, bare ids for its expression measures, and 'calendar::<fragment>' for dates.
// Everything here can be changed in Edit mode.
//
// Studio leaves page navigation to the host, so each page carries a title for the sidebar.

import type { AgFilterState, AgPageState, AgReportState, AgWidgetLayoutState } from 'ag-studio';

export type DashboardPage = { title: string; state: AgPageState };

type Widgets = NonNullable<AgPageState['widgets']>;

const at = (xTrack: number, yTrack: number, xSpan: number, ySpan: number): AgWidgetLayoutState => ({ xTrack, yTrack, xSpan, ySpan });
const title = (text: string) => ({ title: { enabled: true, text } });

const sum = (id: string) => ({ id, aggregation: 'sum' as const });
const avg = (id: string) => ({ id, aggregation: 'avg' as const });
const countd = (id: string) => ({ id, aggregation: 'countd' as const });

// Explicit typography in widget formats takes a literal font stack: some of it is drawn on a
// canvas, which can't resolve CSS variables. Matches --pp-font in app/globals.css.
const PAYPAL_FONT = '"PayPal Open", "Helvetica Neue", Helvetica, Arial, sans-serif';
const typography = (fontSize: number, fontWeight: 'normal' | 'bold' = 'normal') => ({
  fontFamily: PAYPAL_FONT,
  fontSize,
  fontWeight,
  fontStyle: 'normal' as const,
});

// KPI tiles: a bold label as the title above the value. Studio has no per-widget padding, so
// an empty 0px caption is kept on to reserve its row and gap, lifting the value and sparkline
// off the tile's bottom edge.
const bottomSpacer = { enabled: true, text: '', typography: typography(0) };

const kpi = (text: string, value: { id: string; aggregation?: 'sum' | 'avg' | 'countd' }, sparklineX?: string) => ({
  type: 'value' as const,
  dataMapping: { value: [value], ...(sparklineX && { sparklineX: [{ id: sparklineX }] }) },
  format: {
    title: { enabled: true, text, typography: typography(14, 'bold') },
    caption: bottomSpacer,
    style: { typography: typography(22) },
  },
});

// Invoice money isn't converted between currencies, so invoice pages are driven by a
// single-select currency switch, starting on USD.
const currencySwitch = {
  type: 'button-filter' as const,
  dataMapping: { value: [{ id: 'invoices.currency' }] },
  format: {
    ...title('Currency'),
    style: { selection: { type: 'single' as const }, dimensions: { height: 28, minWidth: 48 } },
  },
};

const currencyFilter = (widgetId: string): AgFilterState => ({
  field: { id: 'invoices.currency' },
  model: { operator: 'isIn', value: ['USD'] },
  filterWidgetId: widgetId,
});

const receivableOnly: AgFilterState[] = [{ field: { id: 'invoices.isReceivable' }, model: { operator: 'isTrue' } }];

const revenue: DashboardPage = {
  title: 'Revenue',
  state: {
    id: 'revenue',
    widgets: {
      'invoice-date': {
        type: 'date-filter',
        dataMapping: { value: [{ id: 'invoices.invoiceDate' }] },
        // No default period: a relative date filter in saved state fails to apply on load in
        // Studio 3.0 ("must be a two-element range"), though it works once picked in the widget.
        format: { style: { filterType: 'relative' } },
      },
      'kpi-invoiced': kpi('Invoiced', sum('invoices.issuedAmount'), 'calendar::month'),
      'kpi-collected': kpi('Collected', sum('invoices.paidAmount'), 'calendar::month'),
      'kpi-outstanding': kpi('Outstanding', sum('invoices.outstanding'), 'invoices.outstanding'),
      'kpi-overdue': kpi('Overdue', sum('invoices.overdueAmount'), 'invoices.overdueAmount'),
      'billed-vs-collected': {
        type: 'combo-chart-grouped-column-line',
        dataMapping: {
          categoryKey: [{ id: 'calendar::month' }],
          valueKey: [sum('invoices.issuedAmount'), sum('invoices.paidAmount')],
          secondaryValueKey: [{ id: 'collectionRate' }],
        },
        format: {
          ...title('Invoiced and paid by invoice month, with collection rate'),
          style: { theme: { common: { legend: { enabled: true } } } },
        },
      },
      'collection-rate': {
        type: 'radial-gauge',
        dataMapping: { value: [{ id: 'collectionRate' }] },
        format: {
          ...title('Collection rate'),
          style: {
            scaleLabel: { min: 0, max: 1 },
            label: { typography: typography(24, 'bold') },
            secondaryLabel: { enabled: true, text: 'of invoiced value paid', typography: typography(12) },
          },
        },
      },
      'status-sunburst': {
        type: 'sunburst-chart',
        dataMapping: {
          categoryKey: [{ id: 'invoices.statusGroup' }, { id: 'customers.company' }],
          valueKey: [sum('invoices.total')],
        },
        format: title('Invoice value by status and customer'),
      },
      'items-treemap': {
        type: 'treemap-chart',
        dataMapping: {
          categoryKey: [{ id: 'invoiceItems.unit' }, { id: 'invoiceItems.name' }],
          valueKey: [sum('invoiceItems.lineTotal')],
        },
        format: title('Billing by unit'),
      },
      'payment-methods': {
        type: 'nightingale-chart',
        dataMapping: {
          categoryKey: [{ id: 'invoicePayments.method' }],
          valueKey: [sum('invoicePayments.amount')],
        },
        format: {
          ...title('Payments by method'),
          style: {
            theme: {
              nightingale: {
                series: { label: { enabled: true, ...typography(2) } },
              },
            },
          },
        },
      },
      'invoice-status-pivot': {
        type: 'pivot-grid',
        dataMapping: {
          rows: [{ id: 'customers.company' }, { id: 'invoices.number' }],
          columns: [{ id: 'invoices.status' }],
          values: [sum('invoices.total')],
        },
        format: {
          style: { totalColumns: true, totalColumnsPlacement: 'before', grandTotalRow: { enabled: true } },
        },
      },
    } satisfies Widgets,
    widgetLayout: {
      'kpi-invoiced': at(0, 0, 4, 7),
      'kpi-collected': at(4, 0, 4, 7),
      'kpi-outstanding': at(8, 0, 4, 7),
      'kpi-overdue': at(12, 0, 4, 7),
      'invoice-date': at(16, 0, 8, 7),
      'billed-vs-collected': at(0, 7, 16, 16),
      'collection-rate': at(16, 7, 8, 16),
      'status-sunburst': at(0, 23, 8, 18),
      'items-treemap': at(8, 23, 8, 18),
      'payment-methods': at(16, 23, 8, 18),
      'invoice-status-pivot': at(0, 41, 24, 20),
    },
  },
};

const receivables: DashboardPage = {
  title: 'Receivables',
  state: {
    id: 'receivables',
    widgets: {
      currency: currencySwitch,
      'kpi-outstanding': kpi('Outstanding', sum('invoices.outstanding')),
      'kpi-overdue': kpi('Overdue', sum('invoices.overdueAmount')),
      'kpi-open': kpi('Open invoices', countd('invoices.id')),
      'overdue-share': {
        type: 'radial-gauge',
        dataMapping: { value: [{ id: 'overdueShare' }] },
        format: {
          ...title('Overdue share'),
          style: {
            label: { typography: typography(24) },
            secondaryLabel: { enabled: true, text: 'of receivables past due' },
            scaleLabel: { min: 0, max: 1, typography: typography(11) },
          },
        },
      },
      aging: {
        type: 'column-chart-stacked',
        dataMapping: {
          categoryKey: [{ id: 'customers.name' }],
          valueKey: [sum('invoices.total')],
          legendKey: [{ id: 'invoices.status' }],
        },
        format: {
          ...title('Receivables aging by customer'),
          style: { theme: { common: { legend: { enabled: true } } } },
        },
      },
      'open-invoices': {
        type: 'grid',
        dataMapping: {
          cols: [
            { id: 'invoices.number' },
            { id: 'customers.name' },
            { id: 'customers.company' },
            { id: 'invoices.statusGroup' },
            { id: 'invoices.dueDate' },
            { id: 'invoices.daysOverdue' },
            sum('invoices.total'),
            sum('invoices.paidAmount'),
            sum('invoices.outstanding'),
          ],
        },
        sort: [{ field: { id: 'invoices.daysOverdue' }, direction: 'desc' }],
        format: title('Open invoices, most overdue first'),
      },
    } satisfies Widgets,
    widgetLayout: {
      'kpi-outstanding': at(0, 0, 6, 7),
      'kpi-overdue': at(6, 0, 6, 7),
      'kpi-open': at(12, 0, 6, 7),
      currency: at(18, 0, 6, 7),
      aging: at(0, 7, 16, 18),
      'overdue-share': at(16, 7, 8, 18),
      'open-invoices': at(0, 25, 24, 20),
    },
    filter: {
      page: [currencyFilter('currency'), ...receivableOnly],
    },
  },
};

const cash: DashboardPage = {
  title: 'Cash & payouts',
  state: {
    id: 'cash',
    widgets: {
      'kpi-balance': kpi('Available balance', sum('balances.available')),
      'kpi-paid-out': kpi('Paid out (31 days)', sum('payouts.amount')),
      'kpi-fees': kpi('Payout fees', sum('payouts.fee')),
      'kpi-recipients': kpi('Recipients', countd('payouts.recipient')),
      'payout-treemap': {
        type: 'treemap-chart',
        dataMapping: {
          // Payouts aren't related to customers, so recipient (not company) is the second level.
          categoryKey: [{ id: 'payouts.campaign' }, { id: 'payouts.recipient' }],
          valueKey: [sum('payouts.amount')],
        },
        format: title('Payouts by campaign and recipient'),
      },
      'campaign-donut': {
        type: 'donut-chart',
        dataMapping: {
          categoryKey: [{ id: 'payouts.campaign' }],
          valueKey: [sum('payouts.amount')],
        },
        format: {
          ...title('Payout share by campaign'),
          style: { custom: { pieDataLabel: { enabled: true }, totalLabel: { enabled: true } } },
        },
      },
      ledger: {
        type: 'grid',
        dataMapping: {
          cols: [
            { id: 'transactions.date' },
            { id: 'transactions.eventType' },
            { id: 'transactions.status' },
            { id: 'transactions.counterparty' },
            { id: 'transactions.note' },
            sum('transactions.amount'),
            sum('transactions.fee'),
            sum('transactions.net'),
          ],
        },
        sort: [{ field: { id: 'transactions.date' }, direction: 'desc' }],
        format: title('Ledger'),
      },
    } satisfies Widgets,
    widgetLayout: {
      'kpi-balance': at(0, 0, 6, 7),
      'kpi-paid-out': at(6, 0, 6, 7),
      'kpi-fees': at(12, 0, 6, 7),
      'kpi-recipients': at(18, 0, 6, 7),
      'payout-treemap': at(0, 7, 15, 18),
      'campaign-donut': at(15, 7, 9, 18),
      ledger: at(0, 25, 24, 30),
    },
  },
};

const catalogue: DashboardPage = {
  title: 'Catalogue',
  state: {
    id: 'catalogue',
    widgets: {
      'kpi-products': kpi('Products', countd('products.id')),
      'kpi-plans': kpi('Billing plans', countd('plans.id')),
      'kpi-monthly': kpi('Avg monthly price', avg('plans.monthlyPrice')),
      'kpi-trial': kpi('Avg trial days', avg('plans.trialDays')),
      'catalogue-sunburst': {
        type: 'sunburst-chart',
        dataMapping: {
          categoryKey: [{ id: 'products.type' }, { id: 'products.name' }, { id: 'plans.name' }],
          valueKey: [sum('plans.monthlyPrice')],
        },
        format: title('Catalogue: type, product and plan (sized by monthly price)'),
      },
      'price-range': {
        type: 'bar-chart-grouped',
        dataMapping: {
          categoryKey: [{ id: 'products.name' }],
          valueKey: [
            { id: 'plans.monthlyPrice', aggregation: 'min' },
            avg('plans.monthlyPrice'),
            { id: 'plans.monthlyPrice', aggregation: 'max' },
          ],
        },
        format: {
          ...title('Monthly-normalised price range by product'),
          style: { theme: { common: { legend: { enabled: true, position: 'right' } } } },
        },
      },
      'plan-intervals': {
        type: 'donut-chart',
        dataMapping: {
          categoryKey: [{ id: 'plans.billingInterval' }],
          valueKey: [countd('plans.id')],
        },
        format: {
          ...title('Plans by billing interval'),
          style: { custom: { pieDataLabel: { enabled: true }, totalLabel: { enabled: false } } },
        },
      },
      plans: {
        type: 'grid',
        dataMapping: {
          cols: [
            { id: 'products.name' },
            { id: 'plans.name' },
            { id: 'plans.status' },
            { id: 'plans.billingInterval' },
            sum('plans.price'),
            sum('plans.monthlyPrice'),
            sum('plans.trialDays'),
            sum('plans.setupFee'),
          ],
        },
        sort: [{ field: sum('plans.monthlyPrice'), direction: 'desc' }],
        format: title('Plan catalogue'),
      },
    } satisfies Widgets,
    widgetLayout: {
      'kpi-products': at(0, 0, 6, 7),
      'kpi-plans': at(6, 0, 6, 7),
      'kpi-monthly': at(12, 0, 6, 7),
      'kpi-trial': at(18, 0, 6, 7),
      'plan-intervals': at(0, 7, 10, 20),
      'price-range': at(10, 7, 14, 20),
      plans: at(0, 27, 16, 24),
      'catalogue-sunburst': at(16, 27, 8, 24),
    },
  },
};

export const dashboardPages: DashboardPage[] = [revenue, receivables, cash, catalogue];

export const dashboardReport: AgReportState = {
  selectedPageId: dashboardPages[0].state.id,
  pages: dashboardPages.map((page) => page.state),
};
