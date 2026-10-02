import { getAllBillingPlans, getBalances, getRecentTransactions } from './paypal';

// Flat rows for the Dashboard's AG Studio data sources. Relationships between them:
//   plans.productId          -> products.id
//   billingCycles.planId     -> plans.id
//   payouts.batchId          -> payoutBatches.id
//   transactions.batchId     -> payoutBatches.id
//   transactions.currency    -> balances.currency

const EVENT_TYPES: Record<string, string> = {
  T0001: 'Payout',
  T1105: 'Hold released',
  T1503: 'Hold',
};

const STATUSES: Record<string, string> = {
  S: 'Success',
  P: 'Pending',
  D: 'Denied',
  V: 'Reversed',
  F: 'Partially refunded',
};

// Approximate number of billing periods per month, for comparing plans billed at different intervals.
const PERIODS_PER_MONTH: Record<string, number> = {
  DAY: 365 / 12,
  WEEK: 52 / 12,
  MONTH: 1,
  YEAR: 1 / 12,
};

const amount = (m?: { value?: string } | null) => (m?.value === undefined ? null : Number(m.value));
const date = (iso?: string) => (iso ? new Date(iso) : null);

// 'AGGRID-CLOUD-STORAGE' -> 'Cloud Storage'
const productName = (id: string) =>
  id
    .replace(/^AGGRID-/, '')
    .split('-')
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(' ');

// customField on payouts is '<CAMPAIGN>-<yyyy-mm>-<n>', e.g. 'AGGRID-AFFILIATES-2026-09-1'.
const payoutCategory = (customField?: string) => {
  const campaign = customField?.match(/^AGGRID-([A-Z]+)-/)?.[1];
  return campaign ? productName(campaign) : 'Other';
};

export async function getDashboardData() {
  const [plans, transactions, balances] = await Promise.all([
    getAllBillingPlans(),
    getRecentTransactions(500), // Transaction Search's maximum page size
    getBalances(),
  ]);

  const products = [...new Set(plans.map((p) => p.productId!))].map((id) => ({ id, name: productName(id) }));

  const planRows = plans.map((plan) => {
    const regular = plan.billingCycles?.find((c) => c.tenureType === 'REGULAR');
    const trial = plan.billingCycles?.find((c) => c.tenureType === 'TRIAL');
    const price = amount(regular?.pricingScheme?.fixedPrice);
    const unit = regular?.frequency.intervalUnit;
    const count = regular?.frequency.intervalCount ?? 1;
    return {
      id: plan.id!,
      productId: plan.productId!,
      name: plan.name!,
      status: plan.status!,
      price,
      billingInterval: unit ? `${count} ${unit}` : null,
      monthlyPrice: price !== null && unit ? (price * PERIODS_PER_MONTH[unit]) / count : null,
      trialDays: trial ? trial.frequency.intervalCount! * (trial.frequency.intervalUnit === 'WEEK' ? 7 : 1) : 0,
      setupFee: amount(plan.paymentPreferences?.setupFee) ?? 0,
      paymentFailureThreshold: plan.paymentPreferences?.paymentFailureThreshold ?? null,
      createTime: date(plan.createTime),
    };
  });

  const billingCycles = plans.flatMap((plan) =>
    (plan.billingCycles ?? []).map((cycle) => ({
      id: `${plan.id}-${cycle.sequence}`,
      planId: plan.id!,
      sequence: cycle.sequence,
      tenureType: cycle.tenureType,
      intervalUnit: cycle.frequency.intervalUnit,
      intervalCount: cycle.frequency.intervalCount ?? 1,
      totalCycles: cycle.totalCycles ?? null,
      price: amount(cycle.pricingScheme?.fixedPrice) ?? 0,
    })),
  );

  // Each payout batch places one hold (T1503) on the balance. Its payouts (T0001) and their
  // hold releases (T1105) point back to that hold through paypalReferenceId.
  const batchIdOf = (t: (typeof transactions)[number]['transactionInfo']) =>
    t?.transactionEventCode === 'T1503' ? t.transactionId! : (t?.paypalReferenceId ?? null);

  const transactionRows = transactions.map(({ transactionInfo: t, payerInfo: p }) => ({
    id: t!.transactionId!,
    batchId: batchIdOf(t),
    date: date(t?.transactionInitiationDate),
    eventCode: t?.transactionEventCode ?? null,
    eventType: EVENT_TYPES[t?.transactionEventCode ?? ''] ?? t?.transactionEventCode ?? null,
    status: STATUSES[t?.transactionStatus ?? ''] ?? t?.transactionStatus ?? null,
    currency: t?.transactionAmount?.currencyCode ?? null,
    amount: amount(t?.transactionAmount),
    fee: amount(t?.feeAmount) ?? 0,
    endingBalance: amount(t?.endingBalance),
    counterparty: p?.emailAddress ?? null,
    subject: t?.transactionSubject ?? null,
    note: t?.transactionNote ?? null,
    reference: t?.customField ?? null,
  }));

  const payoutTransactions = transactions.filter((t) => t.transactionInfo?.transactionEventCode === 'T0001');

  const payouts = payoutTransactions.map(({ transactionInfo: t, payerInfo: p }) => ({
    id: t!.transactionId!,
    batchId: t?.paypalReferenceId ?? null,
    reference: t?.customField ?? null,
    category: payoutCategory(t?.customField),
    recipient: p?.emailAddress ?? null,
    date: date(t?.transactionInitiationDate),
    status: STATUSES[t?.transactionStatus ?? ''] ?? t?.transactionStatus ?? null,
    amount: -(amount(t?.transactionAmount) ?? 0),
    fee: -(amount(t?.feeAmount) ?? 0),
    subject: t?.transactionSubject ?? null,
    note: t?.transactionNote ?? null,
  }));

  const payoutBatches = transactions
    .filter((t) => t.transactionInfo?.transactionEventCode === 'T1503')
    .map(({ transactionInfo: t }) => {
      const items = payouts.filter((p) => p.batchId === t!.transactionId);
      return {
        id: t!.transactionId!,
        category: items[0]?.category ?? 'Other',
        date: date(t?.transactionInitiationDate),
        currency: t?.transactionAmount?.currencyCode ?? null,
        heldAmount: -(amount(t?.transactionAmount) ?? 0),
        payoutCount: items.length,
      };
    });

  const balanceRows = (balances.balances ?? []).map((b) => ({
    currency: b.currency,
    total: amount(b.totalBalance),
    available: amount(b.availableBalance),
    withheld: amount(b.withheldBalance),
    asOf: date(balances.asOfTime),
  }));

  return {
    products,
    plans: planRows,
    billingCycles,
    transactions: transactionRows,
    payouts,
    payoutBatches,
    balances: balanceRows,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
