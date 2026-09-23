// Entry point: fetch a PayPal snapshot, turn it into analytics tables, and (via
// ./studio.ts) into an AG Studio data definition.

import {
  PayPalError,
  listInvoiceDetails,
  listPlanDetails,
  listProductDetails,
  searchTransactions,
  type Invoice,
  type Plan,
  type Product,
  type TransactionDetail,
} from "../paypal.ts";
import {
  customerSummary,
  invoiceKpis,
  monthlyActivity,
  paymentMethodMix,
  productPlanSummary,
  receivablesAging,
  transactionSummary,
  type AgingRow,
  type CustomerSummaryRow,
  type InvoiceKpiRow,
  type MonthlyActivityRow,
  type PaymentMethodRow,
  type ProductPlanSummaryRow,
  type TransactionSummaryRow,
} from "./summaries.ts";
import {
  toCustomerRows,
  toInvoiceItemRows,
  toInvoicePaymentRows,
  toInvoiceRows,
  toPlanRows,
  toProductRows,
  toTransactionRows,
  type CustomerRow,
  type InvoiceItemRow,
  type InvoicePaymentRow,
  type InvoiceRow,
  type PlanRow,
  type ProductRow,
  type TransactionRow,
} from "./tables.ts";

export type PayPalSnapshot = {
  products: Product[];
  plans: Plan[];
  invoices: Invoice[];
  /** null when Transaction Search isn't available to the app. */
  transactions: TransactionDetail[] | null;
};

export type UnavailableSource = { source: string; reason: string };

// Transaction Search's maximum range per request.
const TRANSACTION_WINDOW_MS = 31 * 86_400_000;

/** Fetches everything the analytics need. Sources the app lacks permission for are reported, not thrown. */
export async function loadPayPalSnapshot(
  asOf: Date = new Date(),
): Promise<{ snapshot: PayPalSnapshot; unavailable: UnavailableSource[] }> {
  const unavailable: UnavailableSource[] = [];
  const [products, plans, invoices, transactions] = await Promise.all([
    listProductDetails(),
    listPlanDetails(),
    listInvoiceDetails(),
    searchTransactions(new Date(asOf.getTime() - TRANSACTION_WINDOW_MS), asOf).catch((err: unknown) => {
      if (!(err instanceof PayPalError) || err.status !== 403) throw err;
      unavailable.push({ source: "transactions", reason: err.message });
      return null;
    }),
  ]);
  return { snapshot: { products, plans, invoices, transactions }, unavailable };
}

export type AnalyticsTables = {
  // Dimensions
  customers: CustomerRow[];
  products: ProductRow[];
  // Facts
  plans: PlanRow[];
  invoices: InvoiceRow[];
  invoice_items: InvoiceItemRow[];
  invoice_payments: InvoicePaymentRow[];
  transactions: TransactionRow[] | null;
  // Summaries
  invoice_kpis: InvoiceKpiRow[];
  receivables_aging: AgingRow[];
  monthly_activity: MonthlyActivityRow[];
  customer_summary: CustomerSummaryRow[];
  payment_method_mix: PaymentMethodRow[];
  product_plan_summary: ProductPlanSummaryRow[];
  transaction_summary: TransactionSummaryRow[] | null;
};

/** `asOf` fixes "today" for overdue/aging, so results are reproducible. */
export function buildAnalyticsTables(snapshot: PayPalSnapshot, asOf: Date = new Date()): AnalyticsTables {
  const products = toProductRows(snapshot.products);
  const plans = toPlanRows(snapshot.plans);
  const customers = toCustomerRows(snapshot.invoices);
  const invoices = toInvoiceRows(snapshot.invoices, asOf);
  const payments = toInvoicePaymentRows(snapshot.invoices);
  const transactions = snapshot.transactions && toTransactionRows(snapshot.transactions);
  return {
    customers,
    products,
    plans,
    invoices,
    invoice_items: toInvoiceItemRows(snapshot.invoices),
    invoice_payments: payments,
    transactions,
    invoice_kpis: invoiceKpis(invoices),
    receivables_aging: receivablesAging(invoices),
    monthly_activity: monthlyActivity(invoices, payments),
    customer_summary: customerSummary(invoices, customers),
    payment_method_mix: paymentMethodMix(payments),
    product_plan_summary: productPlanSummary(products, plans),
    transaction_summary: transactions && transactionSummary(transactions),
  };
}
