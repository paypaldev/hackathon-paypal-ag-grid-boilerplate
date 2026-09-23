// The dashboard's initial AG Studio report: pages, widgets, layout and filters.
// Field ids reference the tables built in lib/analytics/studio.ts
// (`<table>.<field>`), its expression measures (bare ids) and calendar
// fragments (`calendar::<fragment>`). Users can change everything in Edit mode.
//
// Studio leaves page navigation to the host app, so each page carries a title
// for the dashboard's own tabs.

import type { AgFilterState, AgPageState, AgReportState, AgWidgetLayoutState } from "ag-studio";

const at = (xTrack: number, yTrack: number, xSpan: number, ySpan: number): AgWidgetLayoutState => ({
  xTrack,
  yTrack,
  xSpan,
  ySpan,
});

const title = (text: string) => ({ title: { enabled: true, text } });
const caption = (text: string) => ({ caption: { enabled: true, text } });

export type DashboardPage = {
  title: string;
  state: AgPageState;
  /** Data source the page needs; the page is dropped when the source is absent (e.g. missing PayPal permission). */
  requiresSource?: string;
};

function page(
  id: string,
  pageTitle: string,
  widgets: NonNullable<AgPageState["widgets"]>,
  widgetLayout: Record<string, AgWidgetLayoutState>,
  filter?: AgPageState["filter"],
): DashboardPage {
  return { title: pageTitle, state: { id, filter, widgets, widgetLayout } };
}

// Money is per-currency (no FX), so money pages open filtered to one currency.
const currencyFilter: AgFilterState = {
  field: { id: "invoices.currency" },
  view: { expanded: true, viewTypeId: "selection" },
  model: { operator: "isIn", value: ["USD"] },
};

// Receivables widgets only consider invoices with money still owed.
const receivableOnly: AgFilterState[] = [
  { field: { id: "invoices.is_receivable" }, model: { operator: "isTrue" } },
];

const overview = page(
  "overview",
  "Revenue overview",
  {
    "kpi-invoiced": {
      type: "value",
      dataMapping: {
        value: [{ id: "invoices.issued_amount", aggregation: "sum" }],
        sparklineX: [{ id: "calendar::month" }],
      },
      format: caption("Invoiced"),
    },
    "kpi-collected": {
      type: "value",
      dataMapping: { value: [{ id: "invoices.paid_amount", aggregation: "sum" }] },
      format: caption("Collected"),
    },
    "kpi-outstanding": {
      type: "value",
      dataMapping: { value: [{ id: "invoices.outstanding", aggregation: "sum" }] },
      format: caption("Outstanding"),
    },
    "kpi-collection-rate": {
      type: "value",
      dataMapping: { value: [{ id: "collection_rate" }] },
      format: caption("Collection rate"),
    },
    "kpi-days-to-pay": {
      type: "value",
      dataMapping: { value: [{ id: "invoices.days_to_first_payment", aggregation: "avg" }] },
      format: caption("Avg days to pay"),
    },
    "invoiced-by-month": {
      type: "column-chart-grouped",
      dataMapping: {
        categoryKey: [{ id: "calendar::month" }],
        valueKey: [
          { id: "invoices.issued_amount", aggregation: "sum" },
          { id: "invoices.paid_amount", aggregation: "sum" },
        ],
        tooltipKey: [],
      },
      format: title("Invoiced vs paid, by invoice month"),
    },
    "status-mix": {
      type: "donut-chart",
      dataMapping: {
        categoryKey: [{ id: "invoices.status_group" }],
        valueKey: [{ id: "invoices.total", aggregation: "sum" }],
      },
      format: title("Invoice value by status"),
    },
    customers: {
      type: "grid",
      dataMapping: {
        cols: [
          { id: "customers.name" },
          { id: "customers.business_name" },
          { id: "invoices.issued_amount", aggregation: "sum" },
          { id: "invoices.paid_amount", aggregation: "sum" },
          { id: "invoices.outstanding", aggregation: "sum" },
          { id: "collection_rate" },
        ],
      },
      sort: [{ field: { id: "invoices.issued_amount", aggregation: "sum" }, direction: "desc" }],
      format: title("Customers"),
    },
  },
  {
    "kpi-invoiced": at(0, 0, 6, 7),
    "kpi-collected": at(6, 0, 5, 7),
    "kpi-outstanding": at(11, 0, 5, 7),
    "kpi-collection-rate": at(16, 0, 4, 7),
    "kpi-days-to-pay": at(20, 0, 4, 7),
    "invoiced-by-month": at(0, 7, 15, 16),
    "status-mix": at(15, 7, 9, 16),
    customers: at(0, 23, 24, 19),
  },
  { page: [currencyFilter] },
);

const receivables = page(
  "receivables",
  "Receivables",
  {
    "kpi-outstanding": {
      type: "value",
      dataMapping: { value: [{ id: "invoices.outstanding", aggregation: "sum" }] },
      format: caption("Outstanding"),
    },
    "kpi-overdue": {
      type: "value",
      dataMapping: { value: [{ id: "invoices.overdue_amount", aggregation: "sum" }] },
      format: caption("Overdue"),
    },
    "kpi-overdue-share": {
      type: "value",
      dataMapping: { value: [{ id: "overdue_share" }] },
      format: caption("Overdue share"),
    },
    aging: {
      type: "bar-chart-grouped",
      dataMapping: {
        categoryKey: [{ id: "invoices.aging_bucket" }],
        valueKey: [{ id: "invoices.outstanding", aggregation: "sum" }],
        tooltipKey: [],
      },
      format: title("Receivables aging"),
    },
    "outstanding-by-customer": {
      type: "bar-chart-grouped",
      dataMapping: {
        categoryKey: [{ id: "customers.name" }],
        valueKey: [
          { id: "invoices.outstanding", aggregation: "sum" },
          { id: "invoices.overdue_amount", aggregation: "sum" },
        ],
        tooltipKey: [],
      },
      format: title("Outstanding by customer"),
    },
    "open-invoices": {
      type: "grid",
      dataMapping: {
        cols: [
          { id: "invoices.invoice_number" },
          { id: "customers.name" },
          { id: "invoices.status_group" },
          { id: "invoices.due_date" },
          { id: "days_until_due" },
          { id: "invoices.aging_bucket" },
          { id: "invoices.outstanding", aggregation: "sum" },
        ],
      },
      sort: [{ field: { id: "days_until_due" }, direction: "asc" }],
      format: title("Open invoices by due date"),
    },
  },
  {
    "kpi-outstanding": at(0, 0, 8, 7),
    "kpi-overdue": at(8, 0, 8, 7),
    "kpi-overdue-share": at(16, 0, 8, 7),
    aging: at(0, 7, 12, 16),
    "outstanding-by-customer": at(12, 7, 12, 16),
    "open-invoices": at(0, 23, 24, 14),
  },
  {
    page: [currencyFilter],
    widget: {
      aging: receivableOnly,
      "outstanding-by-customer": receivableOnly,
      "open-invoices": receivableOnly,
    },
  },
);

const payments = page(
  "payments",
  "Payments & line items",
  {
    "kpi-refund-rate": {
      type: "value",
      dataMapping: { value: [{ id: "refund_rate" }] },
      format: caption("Refund rate"),
    },
    "kpi-tax-rate": {
      type: "value",
      dataMapping: { value: [{ id: "effective_tax_rate" }] },
      format: caption("Effective tax rate"),
    },
    "kpi-net-cash": {
      type: "value",
      dataMapping: { value: [{ id: "invoice_payments.signed_amount", aggregation: "sum" }] },
      format: caption("Net cash (payments - refunds)"),
    },
    "payment-methods": {
      type: "donut-chart",
      dataMapping: {
        categoryKey: [{ id: "invoice_payments.method" }],
        valueKey: [{ id: "invoice_payments.amount", aggregation: "sum" }],
      },
      format: title("Payments & refunds by method"),
    },
    "cash-by-month": {
      type: "column-chart-grouped",
      dataMapping: {
        categoryKey: [{ id: "calendar::month" }],
        valueKey: [{ id: "invoice_payments.signed_amount", aggregation: "sum" }],
        tooltipKey: [],
      },
      format: title("Net cash by payment month"),
    },
    "line-items": {
      type: "grid",
      dataMapping: {
        cols: [
          { id: "invoice_items.name" },
          { id: "invoice_items.quantity", aggregation: "sum" },
          { id: "invoice_items.gross", aggregation: "sum" },
          { id: "invoice_items.discount_amount", aggregation: "sum" },
          { id: "invoice_items.tax_amount", aggregation: "sum" },
          { id: "invoice_items.line_total", aggregation: "sum" },
        ],
      },
      sort: [{ field: { id: "invoice_items.line_total", aggregation: "sum" }, direction: "desc" }],
      format: title("Line items"),
    },
  },
  {
    "kpi-refund-rate": at(0, 0, 8, 7),
    "kpi-tax-rate": at(8, 0, 8, 7),
    "kpi-net-cash": at(16, 0, 8, 7),
    "payment-methods": at(0, 7, 9, 16),
    "cash-by-month": at(9, 7, 15, 16),
    "line-items": at(0, 23, 24, 22),
  },
  { page: [currencyFilter] },
);

// All plans are USD, so this page needs no currency filter.
const subscriptions = page(
  "subscriptions",
  "Subscription catalog",
  {
    "kpi-plans": {
      type: "value",
      dataMapping: { value: [{ id: "plans.plan_id", aggregation: "countd" }] },
      format: caption("Billing plans"),
    },
    "kpi-avg-monthly": {
      type: "value",
      dataMapping: { value: [{ id: "plans.monthly_price", aggregation: "avg" }] },
      format: caption("Avg monthly price"),
    },
    "kpi-avg-trial": {
      type: "value",
      dataMapping: { value: [{ id: "plans.trial_days", aggregation: "avg" }] },
      format: caption("Avg trial days"),
    },
    "price-by-product": {
      type: "bar-chart-grouped",
      dataMapping: {
        categoryKey: [{ id: "products.name" }],
        valueKey: [
          { id: "plans.monthly_price", aggregation: "min" },
          { id: "plans.monthly_price", aggregation: "avg" },
          { id: "plans.monthly_price", aggregation: "max" },
        ],
        tooltipKey: [],
      },
      format: title("Monthly-normalised price by product"),
    },
    "plan-status": {
      type: "donut-chart",
      dataMapping: {
        categoryKey: [{ id: "plans.status" }],
        valueKey: [{ id: "plans.plan_id", aggregation: "countd" }],
      },
      format: title("Plans by status"),
    },
    plans: {
      type: "grid",
      dataMapping: {
        cols: [
          { id: "products.name" },
          { id: "plans.name" },
          { id: "plans.status" },
          { id: "plans.billing_interval" },
          { id: "plans.price", aggregation: "sum" },
          { id: "plans.monthly_price", aggregation: "sum" },
          { id: "plans.trial_days", aggregation: "sum" },
          { id: "plans.setup_fee", aggregation: "sum" },
        ],
      },
      sort: [{ field: { id: "plans.monthly_price", aggregation: "sum" }, direction: "desc" }],
      format: title("Plan catalog"),
    },
  },
  {
    "kpi-plans": at(0, 0, 8, 7),
    "kpi-avg-monthly": at(8, 0, 8, 7),
    "kpi-avg-trial": at(16, 0, 8, 7),
    "price-by-product": at(0, 7, 15, 16),
    "plan-status": at(15, 7, 9, 16),
    plans: at(0, 23, 24, 34),
  },
);

// Transaction Search can lag PayPal activity by up to three hours, so this page may be empty at first.
const transactions: DashboardPage = {
  requiresSource: "transactions",
  ...page(
    "transactions",
    "Transactions",
    {
      "kpi-count": {
        type: "value",
        dataMapping: { value: [{ id: "transactions.transaction_id", aggregation: "countd" }] },
        format: caption("Transactions"),
      },
      "kpi-gross": {
        type: "value",
        dataMapping: { value: [{ id: "transactions.amount", aggregation: "sum" }] },
        format: caption("Gross (credits - debits)"),
      },
      "kpi-fees": {
        type: "value",
        dataMapping: { value: [{ id: "transactions.fee", aggregation: "sum" }] },
        format: caption("Fees"),
      },
      "kpi-net": {
        type: "value",
        dataMapping: { value: [{ id: "transactions.net", aggregation: "sum" }] },
        format: caption("Net"),
      },
      "net-by-category": {
        type: "bar-chart-grouped",
        dataMapping: {
          categoryKey: [{ id: "transactions.event_category" }],
          valueKey: [
            { id: "transactions.amount", aggregation: "sum" },
            { id: "transactions.fee", aggregation: "sum" },
          ],
          tooltipKey: [],
        },
        format: title("Amount and fees by T-code category"),
      },
      "by-status": {
        type: "donut-chart",
        dataMapping: {
          categoryKey: [{ id: "transactions.status" }],
          valueKey: [{ id: "transactions.transaction_id", aggregation: "countd" }],
        },
        format: title("Transactions by status"),
      },
      ledger: {
        type: "grid",
        dataMapping: {
          cols: [
            { id: "transactions.initiated_at" },
            { id: "transactions.event_description" },
            { id: "transactions.status" },
            { id: "transactions.counterparty_email" },
            { id: "transactions.note" },
            { id: "transactions.amount", aggregation: "sum" },
            { id: "transactions.fee", aggregation: "sum" },
            { id: "transactions.net", aggregation: "sum" },
          ],
        },
        sort: [{ field: { id: "transactions.initiated_at" }, direction: "desc" }],
        format: title("Ledger"),
      },
    },
    {
      "kpi-count": at(0, 0, 6, 7),
      "kpi-gross": at(6, 0, 6, 7),
      "kpi-fees": at(12, 0, 6, 7),
      "kpi-net": at(18, 0, 6, 7),
      "net-by-category": at(0, 7, 15, 16),
      "by-status": at(15, 7, 9, 16),
      ledger: at(0, 23, 24, 22),
    },
    {
      page: [
        {
          field: { id: "transactions.currency" },
          view: { expanded: true, viewTypeId: "selection" },
          model: { operator: "isIn", value: ["USD"] },
        },
      ],
    },
  ),
};

export const dashboardPages: DashboardPage[] = [overview, receivables, payments, subscriptions, transactions];

export function dashboardReport(pages: DashboardPage[]): AgReportState {
  return {
    selectedPageId: pages[0].state.id,
    panels: { filters: { collapsed: false } },
    pages: pages.map((dashboardPage) => dashboardPage.state),
  };
}
