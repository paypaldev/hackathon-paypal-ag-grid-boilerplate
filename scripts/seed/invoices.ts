// Invoices driven through every lifecycle state the API can reach without a buyer:
// draft, scheduled, sent, paid (recorded), partially paid, refunded, cancelled.
// Invoice numbers are fixed, so re-runs skip invoices that already exist.

import { listInvoices, paypalRequest, type Invoice } from "../../lib/paypal.ts";

type Customer = { given: string; surname: string; email: string; company?: string };

type LineItem = {
  name: string;
  description?: string;
  quantity: string;
  price: string;
  unit: "QUANTITY" | "HOURS" | "AMOUNT";
  taxPercent?: string;
  discountPercent?: string;
};

type Outcome = "draft" | "scheduled" | "sent" | "paid" | "partial" | "refunded" | "cancelled";

type PaymentMethod = "BANK_TRANSFER" | "CASH" | "CHECK" | "CREDIT_CARD" | "WIRE_TRANSFER";

type InvoiceSeed = {
  number: string;
  customer: Customer;
  currency: "USD" | "EUR" | "GBP";
  /** Invoice date relative to today; negative is in the future. */
  daysAgo: number;
  term: "DUE_ON_RECEIPT" | "NET_15" | "NET_30" | "NET_45";
  items: LineItem[];
  invoiceDiscountPercent?: string;
  shipping?: string;
  outcome: Outcome;
  method?: PaymentMethod;
};

const ADA = { given: "Ada", surname: "Lovelace", email: "ada.lovelace@example.com", company: "Analytical Engines Ltd" };
const GRACE = { given: "Grace", surname: "Hopper", email: "grace.hopper@example.com", company: "COBOL Works" };
const ALAN = { given: "Alan", surname: "Turing", email: "alan.turing@example.com" };
const KATHERINE = { given: "Katherine", surname: "Johnson", email: "katherine.johnson@example.com", company: "Orbital Trajectories" };
const LINUS = { given: "Linus", surname: "Torvalds", email: "linus.torvalds@example.com" };
const MARGARET = { given: "Margaret", surname: "Hamilton", email: "margaret.hamilton@example.com", company: "Apollo Software" };
const TIM = { given: "Tim", surname: "Berners-Lee", email: "tim.bernerslee@example.com", company: "Hypertext Partners" };
const HEDY = { given: "Hedy", surname: "Lamarr", email: "hedy.lamarr@example.com" };

const CONSULTING: LineItem = { name: "Consulting", description: "Architecture review", quantity: "12", price: "150.00", unit: "HOURS" };
const WORKSHOP: LineItem = { name: "On-site workshop", quantity: "1", price: "2400.00", unit: "AMOUNT", taxPercent: "8.25" };
const LICENSE: LineItem = { name: "Software license", description: "Annual seat", quantity: "25", price: "49.00", unit: "QUANTITY", taxPercent: "8.25", discountPercent: "10" };
const SUPPORT: LineItem = { name: "Priority support", quantity: "3", price: "300.00", unit: "QUANTITY" };
const HARDWARE: LineItem = { name: "Edge gateway", description: "Model GX-200", quantity: "4", price: "399.99", unit: "QUANTITY", taxPercent: "8.25" };
const DESIGN: LineItem = { name: "UI design", quantity: "30", price: "95.00", unit: "HOURS" };
const HOSTING: LineItem = { name: "Managed hosting", description: "Monthly", quantity: "1", price: "640.00", unit: "AMOUNT", taxPercent: "20" };
const TRAINING: LineItem = { name: "Team training", quantity: "10", price: "180.00", unit: "QUANTITY", discountPercent: "5" };

const SEED: InvoiceSeed[] = [
  { number: "AGG-1001", customer: ADA, currency: "USD", daysAgo: 58, term: "NET_30", items: [CONSULTING, SUPPORT], outcome: "paid", method: "BANK_TRANSFER" },
  { number: "AGG-1002", customer: GRACE, currency: "USD", daysAgo: 54, term: "NET_15", items: [LICENSE], outcome: "paid", method: "CREDIT_CARD" },
  { number: "AGG-1003", customer: ALAN, currency: "USD", daysAgo: 49, term: "DUE_ON_RECEIPT", items: [HARDWARE], shipping: "35.00", outcome: "paid", method: "CHECK" },
  { number: "AGG-1004", customer: KATHERINE, currency: "USD", daysAgo: 45, term: "NET_30", items: [WORKSHOP, TRAINING], invoiceDiscountPercent: "5", outcome: "partial", method: "WIRE_TRANSFER" },
  { number: "AGG-1005", customer: LINUS, currency: "USD", daysAgo: 41, term: "NET_30", items: [SUPPORT], outcome: "refunded", method: "CREDIT_CARD" },
  { number: "AGG-1006", customer: MARGARET, currency: "USD", daysAgo: 37, term: "NET_45", items: [DESIGN, CONSULTING], outcome: "cancelled" },
  { number: "AGG-1007", customer: TIM, currency: "EUR", daysAgo: 33, term: "NET_30", items: [HOSTING], outcome: "paid", method: "BANK_TRANSFER" },
  { number: "AGG-1008", customer: HEDY, currency: "GBP", daysAgo: 29, term: "NET_15", items: [HOSTING, SUPPORT], outcome: "sent" },
  { number: "AGG-1009", customer: ADA, currency: "USD", daysAgo: 24, term: "NET_30", items: [LICENSE, TRAINING], outcome: "partial", method: "CHECK" },
  { number: "AGG-1010", customer: GRACE, currency: "USD", daysAgo: 20, term: "NET_30", items: [CONSULTING], outcome: "sent" },
  { number: "AGG-1011", customer: ALAN, currency: "USD", daysAgo: 16, term: "DUE_ON_RECEIPT", items: [HARDWARE, SUPPORT], shipping: "20.00", outcome: "paid", method: "CASH" },
  { number: "AGG-1012", customer: KATHERINE, currency: "USD", daysAgo: 12, term: "NET_15", items: [DESIGN], outcome: "sent" },
  { number: "AGG-1013", customer: LINUS, currency: "EUR", daysAgo: 8, term: "NET_30", items: [TRAINING], outcome: "cancelled" },
  { number: "AGG-1014", customer: MARGARET, currency: "USD", daysAgo: 4, term: "NET_30", items: [WORKSHOP], outcome: "draft" },
  { number: "AGG-1015", customer: TIM, currency: "USD", daysAgo: 1, term: "NET_45", items: [CONSULTING, LICENSE], invoiceDiscountPercent: "15", outcome: "draft" },
  { number: "AGG-1016", customer: HEDY, currency: "USD", daysAgo: -10, term: "NET_30", items: [SUPPORT, HOSTING], outcome: "scheduled" },
];

const DAY_MS = 86_400_000;

function isoDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * DAY_MS).toISOString().slice(0, 10);
}

function invoiceBody(seed: InvoiceSeed) {
  const money = (value: string) => ({ currency_code: seed.currency, value });
  return {
    detail: {
      invoice_number: seed.number,
      invoice_date: isoDate(seed.daysAgo),
      currency_code: seed.currency,
      note: `Thank you for your business, ${seed.customer.given}.`,
      terms_and_conditions: "Payment is due according to the stated payment terms.",
      payment_term: { term_type: seed.term },
    },
    primary_recipients: [
      {
        billing_info: {
          name: { given_name: seed.customer.given, surname: seed.customer.surname },
          email_address: seed.customer.email,
          ...(seed.customer.company && { business_name: seed.customer.company }),
        },
      },
    ],
    items: seed.items.map((item) => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_amount: money(item.price),
      unit_of_measure: item.unit,
      ...(item.taxPercent && { tax: { name: "Sales Tax", percent: item.taxPercent } }),
      ...(item.discountPercent && { discount: { percent: item.discountPercent } }),
    })),
    configuration: {
      allow_tip: seed.outcome === "sent",
      partial_payment: { allow_partial_payment: seed.outcome === "partial" },
    },
    amount: {
      breakdown: {
        ...(seed.invoiceDiscountPercent && {
          discount: { invoice_discount: { percent: seed.invoiceDiscountPercent } },
        }),
        ...(seed.shipping && { shipping: { amount: money(seed.shipping) } }),
      },
    },
  };
}

async function seedInvoice(seed: InvoiceSeed): Promise<void> {
  const invoice = await paypalRequest<Invoice & { amount: { value: string } }>(
    "POST",
    "/v2/invoicing/invoices",
    invoiceBody(seed),
    `seed-invoice-${seed.number}`,
  );
  const path = `/v2/invoicing/invoices/${invoice.id}`;
  const total = Number(invoice.amount.value);
  // Payment/refund dates must not precede the invoice date or be in the future.
  const settledOn = isoDate(Math.max(0, seed.daysAgo - 5));
  const amount = (value: number) => ({ currency_code: seed.currency, value: value.toFixed(2) });

  if (seed.outcome !== "draft") {
    // Recipient notifications off: the recipients are fictional.
    await paypalRequest("POST", `${path}/send`, { send_to_invoicer: false, send_to_recipient: false });
  }
  if (seed.outcome === "paid" || seed.outcome === "refunded" || seed.outcome === "partial") {
    const paid = seed.outcome === "partial" ? Math.round(total * 40) / 100 : total;
    await paypalRequest("POST", `${path}/payments`, {
      method: seed.method,
      payment_date: settledOn,
      amount: amount(paid),
      note: seed.outcome === "partial" ? "Deposit received" : "Paid in full",
    });
  }
  if (seed.outcome === "refunded") {
    await paypalRequest("POST", `${path}/refunds`, {
      method: seed.method,
      refund_date: isoDate(Math.max(0, seed.daysAgo - 10)),
      amount: amount(total),
    });
  }
  if (seed.outcome === "cancelled") {
    await paypalRequest("POST", `${path}/cancel`, {
      subject: `Invoice ${seed.number} cancelled`,
      note: "Cancelled at customer request.",
      send_to_invoicer: false,
      send_to_recipient: false,
    });
  }

  const final = await paypalRequest<Invoice>("GET", path);
  console.log(`+ invoice ${seed.number} ${final.id} ${seed.currency} ${invoice.amount.value} [${final.status}]`);
}

export async function seedInvoices(): Promise<void> {
  const existing = new Set((await listInvoices()).map((invoice) => invoice.detail.invoice_number));
  for (const seed of SEED) {
    if (existing.has(seed.number)) {
      console.log(`= invoice ${seed.number} exists`);
      continue;
    }
    await seedInvoice(seed);
  }
}
