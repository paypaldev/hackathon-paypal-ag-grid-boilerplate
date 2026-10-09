import {
  amountOf,
  getBalances,
  listInvoices,
  listPlans,
  listProducts,
  searchTransactions,
  TRANSACTION_SEARCH_MAX_DAYS,
  type Balances,
  type IntervalUnit,
  type Invoice,
  type InvoiceStatus,
  type Plan,
  type Product,
  type Transaction,
} from './paypal';

// Flat rows for the Dashboard's AG Studio data sources. Relationships between them:
//   invoices.customerId        -> customers.id
//   invoiceItems.invoiceId     -> invoices.id
//   invoicePayments.invoiceId  -> invoices.id
//   plans.productId            -> products.id
// Invoice, payment, transaction and payout dates also bind to a shared calendar.

const DAY_MS = 86_400_000;

const round2 = (n: number) => Math.round(n * 100) / 100;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

// 'BANK_TRANSFER' -> 'Bank transfer'
const humanise = (code: string) => code[0] + code.slice(1).toLowerCase().replaceAll('_', ' ');

// --- Invoices ---------------------------------------------------------------------

const STATUS_GROUP: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  SENT: 'Open',
  UNPAID: 'Open',
  PAYMENT_PENDING: 'Open',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  MARKED_AS_PAID: 'Paid',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Refunded',
  MARKED_AS_REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

// Not yet sent, or withdrawn: nothing was billed.
const UNISSUED = new Set<InvoiceStatus>(['DRAFT', 'SCHEDULED', 'CANCELLED']);
const RECEIVABLE = new Set<InvoiceStatus>(['SENT', 'UNPAID', 'PAYMENT_PENDING', 'PARTIALLY_PAID']);

// Customers have no id of their own in PayPal, so invoices are matched to them by email.
const customerIdOf = (invoice: Invoice) =>
  invoice.primary_recipients?.[0]?.billing_info?.email_address?.toLowerCase() ?? 'unknown';

// Numbered so the buckets sort in age order on chart axes.
function agingBucket(daysOverdue: number) {
  if (daysOverdue <= 0) return '0. Not yet due';
  if (daysOverdue <= 30) return '1. 1-30 days';
  if (daysOverdue <= 60) return '2. 31-60 days';
  if (daysOverdue <= 90) return '3. 61-90 days';
  return '4. 90+ days';
}

function invoiceRows(invoices: Invoice[], today: string) {
  return invoices.map((inv) => {
    const total = amountOf(inv.amount);
    const paid = amountOf(inv.payments?.paid_amount);
    const refunded = amountOf(inv.refunds?.refund_amount);
    const receivable = RECEIVABLE.has(inv.status);
    const outstanding = receivable ? amountOf(inv.due_amount) : 0;
    const dueDate = inv.detail.payment_term?.due_date ?? inv.detail.invoice_date ?? null;
    const daysOverdue = receivable && dueDate ? Math.max(0, daysBetween(dueDate, today)) : 0;
    const firstPayment = inv.payments?.transactions
      ?.map((t) => t.payment_date)
      .filter((d) => d !== undefined)
      .sort()[0];

    return {
      id: inv.id,
      number: inv.detail.invoice_number,
      customerId: customerIdOf(inv),
      status: humanise(inv.status),
      statusGroup: STATUS_GROUP[inv.status],
      currency: inv.detail.currency_code,
      paymentTerm: inv.detail.payment_term?.term_type ? humanise(inv.detail.payment_term.term_type) : null,
      invoiceDate: inv.detail.invoice_date ?? null,
      dueDate,
      total,
      issuedAmount: UNISSUED.has(inv.status) ? 0 : total,
      paidAmount: paid,
      refundedAmount: refunded,
      netCollected: round2(paid - refunded),
      isReceivable: receivable,
      outstanding,
      overdueAmount: daysOverdue > 0 ? outstanding : 0,
      daysOverdue,
      agingBucket: receivable ? agingBucket(daysOverdue) : null,
      daysToPay: firstPayment && inv.detail.invoice_date ? daysBetween(inv.detail.invoice_date, firstPayment) : null,
      taxTotal: amountOf(inv.amount?.breakdown?.tax_total),
    };
  });
}

function customerRows(invoices: Invoice[]) {
  const byId = new Map<string, { id: string; name: string; company: string | null; email: string | null }>();
  for (const inv of invoices) {
    const info = inv.primary_recipients?.[0]?.billing_info;
    const id = customerIdOf(inv);
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        name: info?.name?.full_name ?? info?.email_address ?? 'Unknown',
        // Individuals have no business name; label them so company charts stay readable.
        company: info?.business_name ?? 'Individual',
        email: info?.email_address ?? null,
      });
    }
  }
  return [...byId.values()];
}

function invoiceItemRows(invoices: Invoice[]) {
  return invoices.flatMap((inv) =>
    (inv.items ?? []).map((item, i) => {
      const gross = Number(item.quantity) * amountOf(item.unit_amount);
      const discount = item.discount?.amount ? amountOf(item.discount.amount) : (gross * Number(item.discount?.percent ?? 0)) / 100;
      const tax = item.tax?.amount ? amountOf(item.tax.amount) : ((gross - discount) * Number(item.tax?.percent ?? 0)) / 100;
      return {
        id: item.id ?? `${inv.id}-${i + 1}`,
        invoiceId: inv.id,
        name: item.name,
        unit: item.unit_of_measure ? humanise(item.unit_of_measure) : null,
        quantity: Number(item.quantity),
        unitPrice: amountOf(item.unit_amount),
        gross: round2(gross),
        discount: round2(discount),
        tax: round2(tax),
        lineTotal: round2(gross - discount + tax),
      };
    }),
  );
}

function invoicePaymentRows(invoices: Invoice[]) {
  return invoices.flatMap((inv) => [
    ...(inv.payments?.transactions ?? []).map((t, i) => ({
      id: t.payment_id ?? `${inv.id}-payment-${i + 1}`,
      invoiceId: inv.id,
      kind: 'Payment',
      method: t.method ? humanise(t.method) : 'Unknown',
      date: t.payment_date ?? null,
      amount: amountOf(t.amount),
      signedAmount: amountOf(t.amount),
    })),
    ...(inv.refunds?.transactions ?? []).map((t, i) => ({
      id: t.recipient_transaction_id ?? `${inv.id}-refund-${i + 1}`,
      invoiceId: inv.id,
      kind: 'Refund',
      method: t.method ? humanise(t.method) : 'Unknown',
      date: t.refund_date ?? null,
      amount: amountOf(t.amount),
      signedAmount: -amountOf(t.amount),
    })),
  ]);
}

// --- Catalog ------------------------------------------------------------------------

const MONTHS_PER_INTERVAL: Record<IntervalUnit, number> = { DAY: 12 / 365, WEEK: 12 / 52, MONTH: 1, YEAR: 12 };
const DAYS_PER_INTERVAL: Record<IntervalUnit, number> = { DAY: 1, WEEK: 7, MONTH: 365 / 12, YEAR: 365 };

function productRows(products: Product[]) {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type ? humanise(p.type) : null,
    category: p.category ? humanise(p.category) : null,
    description: p.description ?? null,
  }));
}

function planRows(plans: Plan[]) {
  return plans.map((plan) => {
    const regular = plan.billing_cycles.find((c) => c.tenure_type === 'REGULAR');
    const trial = plan.billing_cycles.find((c) => c.tenure_type === 'TRIAL');
    const price = regular?.pricing_scheme?.fixed_price ? amountOf(regular.pricing_scheme.fixed_price) : null;
    const unit = regular?.frequency.interval_unit;
    const count = regular?.frequency.interval_count ?? 1;
    return {
      id: plan.id,
      productId: plan.product_id,
      name: plan.name,
      status: humanise(plan.status),
      billingInterval: unit ? (count === 1 ? `Every ${unit.toLowerCase()}` : `Every ${count} ${unit.toLowerCase()}s`) : null,
      price,
      monthlyPrice: price !== null && unit ? round2(price / (count * MONTHS_PER_INTERVAL[unit])) : null,
      trialDays: trial ? Math.round(trial.frequency.interval_count * DAYS_PER_INTERVAL[trial.frequency.interval_unit]) : 0,
      setupFee: amountOf(plan.payment_preferences?.setup_fee),
    };
  });
}

// --- Ledger -------------------------------------------------------------------------

const EVENT_TYPES: Record<string, string> = {
  T0001: 'Payout',
  T1105: 'Hold released',
  T1503: 'Payout hold',
};

const STATUSES: Record<string, string> = {
  S: 'Success',
  P: 'Pending',
  D: 'Denied',
  V: 'Reversed',
  F: 'Partially refunded',
};

const statusOf = (code?: string) => (code ? (STATUSES[code] ?? code) : null);

// Payout custom fields are '<CAMPAIGN>-<yyyy-mm>-<n>', e.g. 'AGGRID-AFFILIATES-2026-09-1'.
const campaignOf = (customField?: string) => {
  const campaign = customField?.match(/^AGGRID-([A-Z]+)-/)?.[1];
  return campaign ? humanise(campaign) : 'Other';
};

function transactionRows(transactions: Transaction[]) {
  return transactions.map(({ transaction_info: t, payer_info: p }) => {
    const amt = amountOf(t.transaction_amount);
    const fee = amountOf(t.fee_amount);
    return {
      id: t.transaction_id,
      date: t.transaction_initiation_date ?? null,
      eventType: EVENT_TYPES[t.transaction_event_code ?? ''] ?? t.transaction_event_code ?? 'Unknown',
      status: statusOf(t.transaction_status),
      direction: amt < 0 ? 'Debit' : 'Credit',
      currency: t.transaction_amount?.currency_code ?? null,
      amount: amt,
      fee,
      net: round2(amt + fee),
      endingBalance: t.ending_balance ? amountOf(t.ending_balance) : null,
      counterparty: p?.email_address ?? null,
      note: t.transaction_note ?? null,
    };
  });
}

// Payouts as positive amounts, so they size treemap tiles and pie slices.
function payoutRows(transactions: Transaction[]) {
  return transactions
    .filter((t) => t.transaction_info.transaction_event_code === 'T0001')
    .map(({ transaction_info: t, payer_info: p }) => ({
      id: t.transaction_id,
      campaign: campaignOf(t.custom_field),
      recipient: p?.email_address ?? 'Unknown',
      date: t.transaction_initiation_date ?? null,
      status: statusOf(t.transaction_status),
      amount: -amountOf(t.transaction_amount),
      fee: -amountOf(t.fee_amount),
      note: t.transaction_note ?? null,
    }));
}

function balanceRows({ balances = [] }: Balances) {
  return balances.map((b) => ({
    currency: b.currency,
    total: amountOf(b.total_balance),
    available: amountOf(b.available_balance),
    withheld: amountOf(b.withheld_balance),
  }));
}

// --- Snapshot -----------------------------------------------------------------------

const TRANSACTION_WINDOW_MS = TRANSACTION_SEARCH_MAX_DAYS * DAY_MS;

export async function getDashboardData(asOf = new Date()) {
  const [products, plans, invoices, transactions, balances] = await Promise.all([
    listProducts(),
    listPlans(),
    listInvoices(),
    searchTransactions(new Date(asOf.getTime() - TRANSACTION_WINDOW_MS), asOf),
    getBalances(),
  ]);
  const today = asOf.toISOString().slice(0, 10);

  return {
    asOf: asOf.toISOString(),
    customers: customerRows(invoices),
    invoices: invoiceRows(invoices, today),
    invoiceItems: invoiceItemRows(invoices),
    invoicePayments: invoicePaymentRows(invoices),
    products: productRows(products),
    plans: planRows(plans),
    transactions: transactionRows(transactions),
    payouts: payoutRows(transactions),
    balances: balanceRows(balances),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
