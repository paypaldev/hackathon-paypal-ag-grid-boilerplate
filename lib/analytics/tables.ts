// Flattens PayPal API payloads into typed, analysis-ready rows (one table per
// entity). Money becomes numbers in the record's own currency, dates become ISO
// strings, and business fields (status group, outstanding, overdue, aging,
// days-to-pay, monthly-normalised plan price) are derived once here so every
// consumer - AG Studio, the summaries, a grid - agrees on their definitions.

import type {
  IntervalUnit,
  Invoice,
  InvoiceStatus,
  Money,
  Plan,
  Product,
  TransactionDetail,
} from "../paypal.ts";

const DAY_MS = 86_400_000;

/** PayPal decimal string -> integer minor units, so sums never accumulate float error. */
export function toCents(money: Money | undefined): number {
  return money ? Math.round(Number(money.value) * 100) : 0;
}

/** Whole days from `from` to `to` (both `YYYY-MM-DD`). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

// --- Products ----------------------------------------------------------------

export type ProductRow = {
  product_id: string;
  name: string;
  description: string | null;
  type: string | null;
  category: string | null;
  created_at: string;
  updated_at: string | null;
};

export function toProductRows(products: Product[]): ProductRow[] {
  return products.map((product) => ({
    product_id: product.id,
    name: product.name,
    description: product.description ?? null,
    type: product.type ?? null,
    category: product.category ?? null,
    created_at: product.create_time,
    updated_at: product.update_time ?? null,
  }));
}

// --- Plans -------------------------------------------------------------------

export type PlanRow = {
  plan_id: string;
  product_id: string;
  name: string;
  status: string;
  billing_interval: string;
  interval_unit: IntervalUnit | null;
  interval_count: number | null;
  currency: string | null;
  price: number | null;
  /** Price normalised to one month, so plans billed weekly/quarterly/yearly compare. */
  monthly_price: number | null;
  annual_price: number | null;
  has_trial: boolean;
  trial_days: number;
  setup_fee: number;
  created_at: string;
};

const MONTHS_PER_UNIT: Record<IntervalUnit, number> = { DAY: 12 / 365, WEEK: 12 / 52, MONTH: 1, YEAR: 12 };
// MONTH/YEAR trials are approximated; the seeded trials are all day-based.
const DAYS_PER_UNIT: Record<IntervalUnit, number> = { DAY: 1, WEEK: 7, MONTH: 365 / 12, YEAR: 365 };

export function toPlanRows(plans: Plan[]): PlanRow[] {
  return plans.map((plan) => {
    const regular = plan.billing_cycles.find((cycle) => cycle.tenure_type === "REGULAR");
    const trials = plan.billing_cycles.filter((cycle) => cycle.tenure_type === "TRIAL");
    const price = regular?.pricing_scheme?.fixed_price;
    const unit = regular?.frequency.interval_unit ?? null;
    const count = regular?.frequency.interval_count ?? null;
    // Unrounded cents per month; round only at output so annual plans keep their exact price.
    const monthlyCents = price && unit && count ? toCents(price) / (count * MONTHS_PER_UNIT[unit]) : null;
    const setupFee = plan.payment_preferences?.setup_fee;

    return {
      plan_id: plan.id,
      product_id: plan.product_id,
      name: plan.name,
      status: plan.status,
      billing_interval:
        unit && count
          ? count === 1
            ? `Every ${unit.toLowerCase()}`
            : `Every ${count} ${unit.toLowerCase()}s`
          : "Unknown",
      interval_unit: unit,
      interval_count: count,
      currency: price?.currency_code ?? setupFee?.currency_code ?? null,
      price: price ? toCents(price) / 100 : null,
      monthly_price: monthlyCents === null ? null : Math.round(monthlyCents) / 100,
      annual_price: monthlyCents === null ? null : Math.round(monthlyCents * 12) / 100,
      has_trial: trials.length > 0,
      trial_days: Math.round(
        trials.reduce(
          (days, cycle) =>
            days +
            cycle.frequency.interval_count *
              DAYS_PER_UNIT[cycle.frequency.interval_unit] *
              Math.max(cycle.total_cycles, 1),
          0,
        ),
      ),
      setup_fee: toCents(setupFee) / 100,
      created_at: plan.create_time,
    };
  });
}

// --- Invoices ----------------------------------------------------------------

export type InvoiceStatusGroup =
  | "Draft"
  | "Scheduled"
  | "Open"
  | "Partially paid"
  | "Paid"
  | "Refunded"
  | "Cancelled";

const STATUS_GROUP: Record<InvoiceStatus, InvoiceStatusGroup> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  SENT: "Open",
  UNPAID: "Open",
  PAYMENT_PENDING: "Open",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  MARKED_AS_PAID: "Paid",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Refunded",
  MARKED_AS_REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

export const AGING_BUCKETS = ["Not yet due", "1-30 days", "31-60 days", "61-90 days", "90+ days"] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

export type InvoiceRow = {
  invoice_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  status_group: InvoiceStatusGroup;
  /** Sent to the customer and not cancelled: counts toward invoiced revenue. */
  is_issued: boolean;
  /** Issued with money still expected (open or partially paid). */
  is_receivable: boolean;
  customer_id: string | null;
  currency: string;
  payment_term: string | null;
  invoice_date: string | null;
  due_date: string | null;
  created_at: string | null;
  item_count: number;
  item_subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping: number;
  total: number;
  /** `total` when issued, else 0 - sum this for invoiced revenue. */
  issued_amount: number;
  paid_amount: number;
  refunded_amount: number;
  net_collected: number;
  /** Amount still owed on receivable invoices; 0 otherwise. */
  outstanding: number;
  is_overdue: boolean;
  days_overdue: number | null;
  overdue_amount: number;
  aging_bucket: AgingBucket | null;
  first_payment_date: string | null;
  days_to_first_payment: number | null;
};

function agingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return "Not yet due";
  if (daysOverdue <= 30) return "1-30 days";
  if (daysOverdue <= 60) return "31-60 days";
  if (daysOverdue <= 90) return "61-90 days";
  return "90+ days";
}

export function customerId(invoice: Invoice): string | null {
  return invoice.primary_recipients?.[0]?.billing_info?.email_address?.toLowerCase() ?? null;
}

export function toInvoiceRows(invoices: Invoice[], asOf: Date): InvoiceRow[] {
  const today = asOf.toISOString().slice(0, 10);
  return invoices.map((invoice) => {
    const group = STATUS_GROUP[invoice.status];
    const isIssued = group !== "Draft" && group !== "Scheduled" && group !== "Cancelled";
    const isReceivable = group === "Open" || group === "Partially paid";
    const breakdown = invoice.amount?.breakdown;
    const total = toCents(invoice.amount);
    const paid = toCents(invoice.payments?.paid_amount);
    const refunded = toCents(invoice.refunds?.refund_amount);
    const outstanding = isReceivable ? toCents(invoice.due_amount) : 0;
    const dueDate = invoice.detail.payment_term?.due_date ?? null;
    const daysOverdue = isReceivable && dueDate ? Math.max(0, daysBetween(dueDate, today)) : null;
    const isOverdue = daysOverdue !== null && daysOverdue > 0;
    const paymentDates = (invoice.payments?.transactions ?? [])
      .map((payment) => payment.payment_date)
      .filter((date) => date !== undefined)
      .sort();
    const firstPayment = paymentDates[0] ?? null;
    const invoiceDate = invoice.detail.invoice_date ?? null;

    return {
      invoice_id: invoice.id,
      invoice_number: invoice.detail.invoice_number,
      status: invoice.status,
      status_group: group,
      is_issued: isIssued,
      is_receivable: isReceivable,
      customer_id: customerId(invoice),
      currency: invoice.detail.currency_code,
      payment_term: invoice.detail.payment_term?.term_type ?? null,
      invoice_date: invoiceDate,
      due_date: dueDate,
      created_at: invoice.detail.metadata?.create_time ?? null,
      item_count: invoice.items?.length ?? 0,
      item_subtotal: toCents(breakdown?.item_total) / 100,
      // PayPal reports discounts as negative amounts.
      discount_total:
        (Math.abs(toCents(breakdown?.discount?.invoice_discount?.amount)) +
          Math.abs(toCents(breakdown?.discount?.item_discount))) /
        100,
      tax_total: toCents(breakdown?.tax_total) / 100,
      shipping: toCents(breakdown?.shipping?.amount) / 100,
      total: total / 100,
      issued_amount: isIssued ? total / 100 : 0,
      paid_amount: paid / 100,
      refunded_amount: refunded / 100,
      net_collected: (paid - refunded) / 100,
      outstanding: outstanding / 100,
      is_overdue: isOverdue,
      days_overdue: daysOverdue,
      overdue_amount: isOverdue ? outstanding / 100 : 0,
      aging_bucket: daysOverdue === null ? null : agingBucket(daysOverdue),
      first_payment_date: firstPayment,
      days_to_first_payment:
        firstPayment && invoiceDate ? daysBetween(invoiceDate, firstPayment) : null,
    };
  });
}

// --- Invoice line items ------------------------------------------------------

export type InvoiceItemRow = {
  item_id: string;
  invoice_id: string;
  line_no: number;
  currency: string;
  name: string;
  description: string | null;
  unit_of_measure: string | null;
  quantity: number;
  unit_price: number;
  /** quantity x unit_price, before line discount and tax. */
  gross: number;
  discount_percent: number | null;
  discount_amount: number;
  tax_name: string | null;
  tax_percent: number | null;
  tax_amount: number;
  /** gross - discount + tax. Invoice-level discounts and shipping are not allocated to lines. */
  line_total: number;
};

export function toInvoiceItemRows(invoices: Invoice[]): InvoiceItemRow[] {
  return invoices.flatMap((invoice) =>
    (invoice.items ?? []).map((item, index) => {
      const quantity = Number(item.quantity);
      const gross = Math.round(quantity * toCents(item.unit_amount));
      const discount = Math.abs(toCents(item.discount?.amount));
      const tax = toCents(item.tax?.amount);
      return {
        item_id: item.id ?? `${invoice.id}-${index + 1}`,
        invoice_id: invoice.id,
        line_no: index + 1,
        currency: item.unit_amount.currency_code,
        name: item.name,
        description: item.description ?? null,
        unit_of_measure: item.unit_of_measure ?? null,
        quantity,
        unit_price: toCents(item.unit_amount) / 100,
        gross: gross / 100,
        discount_percent: item.discount?.percent ? Number(item.discount.percent) : null,
        discount_amount: discount / 100,
        tax_name: item.tax?.name ?? null,
        tax_percent: item.tax?.percent ? Number(item.tax.percent) : null,
        tax_amount: tax / 100,
        line_total: (gross - discount + tax) / 100,
      };
    }),
  );
}

// --- Invoice payments & refunds ----------------------------------------------

export type InvoicePaymentRow = {
  payment_id: string;
  invoice_id: string;
  customer_id: string | null;
  kind: "Payment" | "Refund";
  method: string;
  payment_date: string | null;
  currency: string;
  amount: number;
  /** Positive for payments, negative for refunds - sum for net cash. */
  signed_amount: number;
  note: string | null;
};

export function toInvoicePaymentRows(invoices: Invoice[]): InvoicePaymentRow[] {
  return invoices.flatMap((invoice) => {
    const customer = customerId(invoice);
    const payments = (invoice.payments?.transactions ?? []).map((payment, index) => {
      const amount = toCents(payment.amount);
      return {
        payment_id: payment.payment_id ?? `${invoice.id}-P${index + 1}`,
        invoice_id: invoice.id,
        customer_id: customer,
        kind: "Payment" as const,
        method: payment.method ?? "UNKNOWN",
        payment_date: payment.payment_date ?? null,
        currency: payment.amount.currency_code,
        amount: amount / 100,
        signed_amount: amount / 100,
        note: payment.note ?? null,
      };
    });
    const refunds = (invoice.refunds?.transactions ?? []).map((refund, index) => {
      const amount = toCents(refund.amount);
      return {
        payment_id: refund.recipient_transaction_id ?? `${invoice.id}-R${index + 1}`,
        invoice_id: invoice.id,
        customer_id: customer,
        kind: "Refund" as const,
        method: refund.method ?? "UNKNOWN",
        payment_date: refund.refund_date ?? null,
        currency: refund.amount.currency_code,
        amount: amount / 100,
        signed_amount: -amount / 100,
        note: refund.note ?? null,
      };
    });
    return [...payments, ...refunds];
  });
}

// --- Customers (invoice recipients) ------------------------------------------

export type CustomerRow = {
  customer_id: string;
  name: string | null;
  business_name: string | null;
  email: string;
};

export function toCustomerRows(invoices: Invoice[]): CustomerRow[] {
  const customers = new Map<string, CustomerRow>();
  for (const invoice of invoices) {
    const id = customerId(invoice);
    const info = invoice.primary_recipients?.[0]?.billing_info;
    if (!id || customers.has(id)) continue;
    customers.set(id, {
      customer_id: id,
      name: info?.name?.full_name ?? null,
      business_name: info?.business_name ?? null,
      email: info?.email_address ?? id,
    });
  }
  return [...customers.values()];
}

// --- Transactions (Transaction Search) ---------------------------------------

export type TransactionRow = {
  transaction_id: string;
  event_code: string | null;
  event_description: string | null;
  event_category: string;
  status: string;
  direction: "Credit" | "Debit";
  initiated_at: string | null;
  updated_at: string | null;
  currency: string | null;
  amount: number;
  fee: number;
  net: number;
  counterparty_email: string | null;
  counterparty_name: string | null;
  subject: string | null;
  note: string | null;
  reference_id: string | null;
};

// https://developer.paypal.com/docs/api/transaction-search/v1/ (transaction_status)
const TRANSACTION_STATUS: Record<string, string> = {
  D: "Denied",
  P: "Pending",
  S: "Success",
  V: "Reversed",
  F: "Partially refunded",
};

// Common codes from https://developer.paypal.com/reports/reference/t-codes
const EVENT_DESCRIPTIONS: Record<string, string> = {
  T0000: "General payment",
  T0001: "Mass payment",
  T0002: "Subscription payment",
  T0006: "Express Checkout payment",
  T0007: "Standard web checkout payment",
  T0104: "Fee for mass pay request",
  T0107: "Payment fee",
  T0400: "General withdrawal - bank account",
  T1107: "Payment refund",
  T1114: "Mass payment reversal",
  T1115: "Mass payment refund",
  T1201: "Chargeback",
};

const CHARGEBACK_CODES = ["T1106", "T1110", "T1111", "T1201", "T1202", "T1205", "T1207", "T1208"];
const DEPOSIT_GROUPS = ["03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "14", "16", "17", "18", "19", "20", "30"];

/** T-code -> category, following PayPal's T-code reference groupings. */
export function transactionCategory(code: string | undefined): string {
  if (!code) return "Unknown";
  if (CHARGEBACK_CODES.includes(code)) return "Chargeback";
  if (code === "T2103" || code === "T2104") return "Reserves";
  if (code === "T2114" || code.startsWith("T23")) return "Withheld";
  const group = code.slice(1, 3);
  if (group === "00") return "Payments received and sent";
  if (group === "01") return "Fees";
  if (group === "02") return "Transfers";
  if (group === "13") return "Authorizations";
  if (group === "15" || group === "21") return "Releases";
  if (group === "97") return "Payables and receivables";
  if (group === "98") return "Other (non-balance impacting)";
  if (DEPOSIT_GROUPS.includes(group)) return "Deposits and credits";
  return "Other";
}

export function toTransactionRows(details: TransactionDetail[]): TransactionRow[] {
  return details.map(({ transaction_info: info, payer_info: payer }) => {
    const amount = toCents(info.transaction_amount);
    const fee = toCents(info.fee_amount);
    const code = info.transaction_event_code;
    return {
      transaction_id: info.transaction_id,
      event_code: code ?? null,
      event_description: code ? (EVENT_DESCRIPTIONS[code] ?? code) : null,
      event_category: transactionCategory(code),
      status: TRANSACTION_STATUS[info.transaction_status ?? ""] ?? info.transaction_status ?? "Unknown",
      direction: amount < 0 ? "Debit" : "Credit",
      initiated_at: info.transaction_initiation_date ?? null,
      updated_at: info.transaction_updated_date ?? null,
      currency: info.transaction_amount?.currency_code ?? null,
      amount: amount / 100,
      fee: fee / 100,
      net: (amount + fee) / 100,
      counterparty_email: payer?.email_address ?? null,
      counterparty_name:
        payer?.payer_name?.alternate_full_name ??
        ([payer?.payer_name?.given_name, payer?.payer_name?.surname].filter(Boolean).join(" ") || null),
      subject: info.transaction_subject ?? null,
      note: info.transaction_note ?? null,
      reference_id: info.paypal_reference_id ?? null,
    };
  });
}
