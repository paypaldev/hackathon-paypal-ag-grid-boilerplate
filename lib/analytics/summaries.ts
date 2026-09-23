// Pre-aggregated tables built from the flat rows in ./tables.ts. AG Studio can
// aggregate the flat tables itself; these exist for KPI tiles and charts that
// need business logic the engine can't express simply (zero-filled month spines,
// ordered aging buckets, per-customer rollups) and as ready-made examples.
//
// Money is never summed across currencies: PayPal's FX quote API isn't
// provisioned for this sandbox, so every monetary summary is keyed by currency.

import {
  AGING_BUCKETS,
  type AgingBucket,
  type CustomerRow,
  type InvoicePaymentRow,
  type InvoiceRow,
  type PlanRow,
  type ProductRow,
  type TransactionRow,
} from "./tables.ts";

function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const group = groups.get(k);
    if (group) group.push(row);
    else groups.set(k, [row]);
  }
  return groups;
}

/** Sums 2-decimal money values in cents so the result has no float drift. */
function sumMoney<T>(rows: T[], value: (row: T) => number): number {
  return rows.reduce((cents, row) => cents + Math.round(value(row) * 100), 0) / 100;
}

/** Mean rounded to `digits` decimals; null for an empty list. */
function mean(values: number[], digits: number): number | null {
  if (!values.length) return null;
  const scale = 10 ** digits;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * scale) / scale;
}

const byCurrency = (a: { currency: string | null }, b: { currency: string | null }) =>
  (a.currency ?? "").localeCompare(b.currency ?? "");

// --- Invoice KPIs --------------------------------------------------------------

export type InvoiceKpiRow = {
  currency: string;
  invoices: number;
  issued_invoices: number;
  /** Drafts plus scheduled invoices not yet sent. */
  unsent_invoices: number;
  open_invoices: number;
  overdue_invoices: number;
  paid_invoices: number;
  cancelled_invoices: number;
  issued_amount: number;
  paid_amount: number;
  refunded_amount: number;
  net_collected: number;
  outstanding: number;
  overdue_amount: number;
  average_invoice: number | null;
  /** paid_amount / issued_amount, 0-1. */
  collection_rate: number | null;
  avg_days_to_pay: number | null;
};

/** One headline row per currency - the numbers behind KPI tiles. */
export function invoiceKpis(invoices: InvoiceRow[]): InvoiceKpiRow[] {
  return [...groupBy(invoices, (row) => row.currency)].map(([currency, rows]) => {
    const issued = rows.filter((row) => row.is_issued);
    const issuedAmount = sumMoney(issued, (row) => row.total);
    const paidAmount = sumMoney(rows, (row) => row.paid_amount);
    return {
      currency,
      invoices: rows.length,
      issued_invoices: issued.length,
      unsent_invoices: rows.filter((row) => row.status_group === "Draft" || row.status_group === "Scheduled").length,
      open_invoices: rows.filter((row) => row.is_receivable).length,
      overdue_invoices: rows.filter((row) => row.is_overdue).length,
      paid_invoices: rows.filter((row) => row.status_group === "Paid").length,
      cancelled_invoices: rows.filter((row) => row.status_group === "Cancelled").length,
      issued_amount: issuedAmount,
      paid_amount: paidAmount,
      refunded_amount: sumMoney(rows, (row) => row.refunded_amount),
      net_collected: sumMoney(rows, (row) => row.net_collected),
      outstanding: sumMoney(rows, (row) => row.outstanding),
      overdue_amount: sumMoney(rows, (row) => row.overdue_amount),
      average_invoice: issued.length ? Math.round((issuedAmount / issued.length) * 100) / 100 : null,
      collection_rate: issuedAmount ? Math.round((paidAmount / issuedAmount) * 10_000) / 10_000 : null,
      avg_days_to_pay: mean(
        rows.flatMap((row) => (row.days_to_first_payment === null ? [] : [row.days_to_first_payment])),
        1,
      ),
    };
  }).sort(byCurrency);
}

// --- Receivables aging -------------------------------------------------------

export type AgingRow = {
  currency: string;
  aging_bucket: AgingBucket;
  /** 1-5; sort by this so buckets read left-to-right in charts. */
  bucket_order: number;
  invoices: number;
  outstanding: number;
};

/** Outstanding receivables per aging bucket, every bucket present (zero-filled). */
export function receivablesAging(invoices: InvoiceRow[]): AgingRow[] {
  const receivable = invoices.filter((row) => row.is_receivable);
  return [...groupBy(receivable, (row) => row.currency)]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([currency, rows]) =>
      AGING_BUCKETS.map((bucket, index) => {
        const inBucket = rows.filter((row) => row.aging_bucket === bucket);
        return {
          currency,
          aging_bucket: bucket,
          bucket_order: index + 1,
          invoices: inBucket.length,
          outstanding: sumMoney(inBucket, (row) => row.outstanding),
        };
      }),
    );
}

// --- Monthly activity --------------------------------------------------------

export type MonthlyActivityRow = {
  /** First day of the month, `YYYY-MM-01`. */
  month: string;
  currency: string;
  invoices_issued: number;
  invoiced_amount: number;
  collected_amount: number;
  refunded_amount: number;
  /** collected - refunded. */
  net_cash: number;
};

/** Invoiced (by invoice date) vs cash collected/refunded (by payment date), per month and currency, with empty months zero-filled. */
export function monthlyActivity(invoices: InvoiceRow[], payments: InvoicePaymentRow[]): MonthlyActivityRow[] {
  const issued = invoices.filter((row) => row.is_issued && row.invoice_date);
  const dated = payments.filter((row) => row.payment_date);
  const months = [
    ...issued.map((row) => row.invoice_date!.slice(0, 7)),
    ...dated.map((row) => row.payment_date!.slice(0, 7)),
  ].sort();
  if (!months.length) return [];

  // Every month from the first to the last event, so charts show empty months as zero.
  const spine = [months[0]];
  while (spine[spine.length - 1] !== months[months.length - 1]) {
    const [year, month] = spine[spine.length - 1].split("-").map(Number);
    spine.push(month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`);
  }

  const invoicesByKey = groupBy(issued, (row) => `${row.currency} ${row.invoice_date!.slice(0, 7)}`);
  const paymentsByKey = groupBy(dated, (row) => `${row.currency} ${row.payment_date!.slice(0, 7)}`);
  const currencies = [...new Set([...issued, ...dated].map((row) => row.currency))].sort();

  return currencies.flatMap((currency) =>
    spine.map((month) => {
      const monthInvoices = invoicesByKey.get(`${currency} ${month}`) ?? [];
      const monthPayments = paymentsByKey.get(`${currency} ${month}`) ?? [];
      const collected = sumMoney(monthPayments.filter((row) => row.kind === "Payment"), (row) => row.amount);
      const refunded = sumMoney(monthPayments.filter((row) => row.kind === "Refund"), (row) => row.amount);
      return {
        month: `${month}-01`,
        currency,
        invoices_issued: monthInvoices.length,
        invoiced_amount: sumMoney(monthInvoices, (row) => row.total),
        collected_amount: collected,
        refunded_amount: refunded,
        net_cash: Math.round((collected - refunded) * 100) / 100,
      };
    }),
  );
}

// --- Customers ---------------------------------------------------------------

export type CustomerSummaryRow = {
  customer_id: string;
  customer_name: string | null;
  business_name: string | null;
  currency: string;
  invoices: number;
  issued_amount: number;
  paid_amount: number;
  refunded_amount: number;
  outstanding: number;
  overdue_amount: number;
  first_invoice_date: string | null;
  last_invoice_date: string | null;
  avg_days_to_pay: number | null;
};

/** Lifetime value and payment behaviour per customer and currency. */
export function customerSummary(invoices: InvoiceRow[], customers: CustomerRow[]): CustomerSummaryRow[] {
  const customerById = new Map(customers.map((customer) => [customer.customer_id, customer]));
  const withCustomer = invoices.filter((row) => row.customer_id !== null);
  return [...groupBy(withCustomer, (row) => `${row.customer_id} ${row.currency}`)]
    .map(([, rows]) => {
      const customer = customerById.get(rows[0].customer_id!);
      const dates = rows.flatMap((row) => (row.invoice_date ? [row.invoice_date] : [])).sort();
      return {
        customer_id: rows[0].customer_id!,
        customer_name: customer?.name ?? null,
        business_name: customer?.business_name ?? null,
        currency: rows[0].currency,
        invoices: rows.length,
        issued_amount: sumMoney(rows, (row) => row.issued_amount),
        paid_amount: sumMoney(rows, (row) => row.paid_amount),
        refunded_amount: sumMoney(rows, (row) => row.refunded_amount),
        outstanding: sumMoney(rows, (row) => row.outstanding),
        overdue_amount: sumMoney(rows, (row) => row.overdue_amount),
        first_invoice_date: dates[0] ?? null,
        last_invoice_date: dates[dates.length - 1] ?? null,
        avg_days_to_pay: mean(
          rows.flatMap((row) => (row.days_to_first_payment === null ? [] : [row.days_to_first_payment])),
          1,
        ),
      };
    })
    .sort((a, b) => b.issued_amount - a.issued_amount || a.customer_id.localeCompare(b.customer_id));
}

// --- Payment methods ---------------------------------------------------------

export type PaymentMethodRow = {
  currency: string;
  kind: InvoicePaymentRow["kind"];
  method: string;
  payments: number;
  amount: number;
};

/** How customers pay (and how refunds go back), per currency. */
export function paymentMethodMix(payments: InvoicePaymentRow[]): PaymentMethodRow[] {
  return [...groupBy(payments, (row) => `${row.currency} ${row.kind} ${row.method}`)]
    .map(([, rows]) => ({
      currency: rows[0].currency,
      kind: rows[0].kind,
      method: rows[0].method,
      payments: rows.length,
      amount: sumMoney(rows, (row) => row.amount),
    }))
    .sort((a, b) => byCurrency(a, b) || a.kind.localeCompare(b.kind) || b.amount - a.amount);
}

// --- Subscription catalog ----------------------------------------------------

export type ProductPlanSummaryRow = {
  product_id: string;
  product_name: string | null;
  currency: string | null;
  plans: number;
  active_plans: number;
  plans_with_trial: number;
  plans_with_setup_fee: number;
  min_monthly_price: number | null;
  avg_monthly_price: number | null;
  max_monthly_price: number | null;
};

/** Plan counts and monthly-normalised price range per product. */
export function productPlanSummary(products: ProductRow[], plans: PlanRow[]): ProductPlanSummaryRow[] {
  const productNames = new Map(products.map((product) => [product.product_id, product.name]));
  return [...groupBy(plans, (row) => `${row.product_id} ${row.currency}`)]
    .map(([, rows]) => {
      const monthly = rows.flatMap((row) => (row.monthly_price === null ? [] : [row.monthly_price]));
      return {
        product_id: rows[0].product_id,
        product_name: productNames.get(rows[0].product_id) ?? null,
        currency: rows[0].currency,
        plans: rows.length,
        active_plans: rows.filter((row) => row.status === "ACTIVE").length,
        plans_with_trial: rows.filter((row) => row.has_trial).length,
        plans_with_setup_fee: rows.filter((row) => row.setup_fee > 0).length,
        min_monthly_price: monthly.length ? Math.min(...monthly) : null,
        avg_monthly_price: mean(monthly, 2),
        max_monthly_price: monthly.length ? Math.max(...monthly) : null,
      };
    })
    .sort((a, b) => (a.product_name ?? a.product_id).localeCompare(b.product_name ?? b.product_id));
}

// --- Transactions ------------------------------------------------------------

export type TransactionSummaryRow = {
  currency: string | null;
  event_category: string;
  status: string;
  transactions: number;
  gross: number;
  fees: number;
  net: number;
};

/** Money movement per T-code category and status. */
export function transactionSummary(transactions: TransactionRow[]): TransactionSummaryRow[] {
  return [...groupBy(transactions, (row) => `${row.currency} ${row.event_category} ${row.status}`)]
    .map(([, rows]) => ({
      currency: rows[0].currency,
      event_category: rows[0].event_category,
      status: rows[0].status,
      transactions: rows.length,
      gross: sumMoney(rows, (row) => row.amount),
      fees: sumMoney(rows, (row) => row.fee),
      net: sumMoney(rows, (row) => row.net),
    }))
    .sort((a, b) => byCurrency(a, b) || a.event_category.localeCompare(b.event_category));
}
