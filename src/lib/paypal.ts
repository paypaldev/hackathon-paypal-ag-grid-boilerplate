import "server-only";
import { getPayPalAccessToken, isUsingSimulatedToken } from "./paypal-auth";

// PayPal REST client: every call this demo makes to PayPal goes through here. It covers
// catalog products, billing plans, invoicing, Transaction Search and balances, with plain
// fetch and no SDK. Server-side only: it reads the client secret from the environment.

const BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const MAX_ATTEMPTS = 3;

export class PayPalApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    body: string,
  ) {
    super(`PayPal ${status} on ${path}: ${body.slice(0, 300)}`);
    this.name = 'PayPalApiError';
  }
}

async function get<T>(path: string): Promise<T> {
  const token = await getPayPalAccessToken();

  if (isUsingSimulatedToken()) {
    throw new PayPalApiError(401, path, "Simulated sandbox mode: falling back to seeded records.");
  }

  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) return (await res.json()) as T;

    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 250));
      continue;
    }
    throw new PayPalApiError(res.status, path, await res.text());
  }
}

// `path` must already carry whatever flag makes the endpoint report `total_pages`.
async function listAll<T>(path: string, key: string, pageSize: number): Promise<T[]> {
  const items: T[] = [];
  const sep = path.includes('?') ? '&' : '?';
  for (let page = 1; ; page++) {
    const res = await get<{ total_pages?: number } & Record<string, unknown>>(
      `${path}${sep}page_size=${pageSize}&page=${page}`,
    );
    items.push(...((res[key] as T[] | undefined) ?? []));
    if (page >= (res.total_pages ?? 1)) return items;
  }
}

export type Money = { value: string; currency_code: string };

// PayPal sends amounts as decimal strings; missing amounts count as 0.
export const amountOf = (m?: Money | null) => (m?.value === undefined ? 0 : Number(m.value));

// --- Catalog products & billing plans ------------------------------------------

export type Product = {
  id: string;
  name: string;
  description?: string;
  type?: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  category?: string;
  create_time: string;
};

export type IntervalUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type BillingCycle = {
  frequency: { interval_unit: IntervalUnit; interval_count: number };
  tenure_type: 'REGULAR' | 'TRIAL';
  sequence: number;
  total_cycles: number;
  pricing_scheme?: { fixed_price?: Money };
};

export type Plan = {
  id: string;
  product_id: string;
  name: string;
  status: 'CREATED' | 'INACTIVE' | 'ACTIVE';
  create_time: string;
  billing_cycles: BillingCycle[];
  payment_preferences?: { setup_fee?: Money };
};

const SEED_PRODUCTS: Product[] = [
  {
    id: "PROD-DEMO-001",
    name: "Autonomous High-Density GPU Rack H100",
    description: "Enterprise AI cluster hardware with redundant liquid cooling and dual 100GbE NICs",
    type: "PHYSICAL",
    category: "Cloud Hardware",
    create_time: "2026-11-01T00:00:00Z",
  },
  {
    id: "PROD-DEMO-002",
    name: "VeriSettle Escrow Telemetry Gateway",
    description: "Cryptographic policy enforcement edge appliance for real-time B2B dispute logging",
    type: "PHYSICAL",
    category: "Office Equipment",
    create_time: "2026-11-02T00:00:00Z",
  },
  {
    id: "PROD-DEMO-003",
    name: "Sustainable B2B Industrial Packaging Lot",
    description: "FSC-certified commercial shipping cartons and temperature-controlled pallet wraps",
    type: "PHYSICAL",
    category: "Cafe & Packaging Supplies",
    create_time: "2026-11-03T00:00:00Z",
  },
];

const SEED_PLANS: Plan[] = [
  {
    id: "PLAN-DEMO-001",
    product_id: "PROD-DEMO-001",
    name: "Enterprise Cluster SLA Support",
    status: "ACTIVE",
    create_time: "2026-11-01T00:00:00Z",
    billing_cycles: [
      {
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 12,
        pricing_scheme: { fixed_price: { value: "450.00", currency_code: "USD" } },
      },
    ],
    payment_preferences: { setup_fee: { value: "0.00", currency_code: "USD" } },
  },
];

// The list endpoints return summaries (no product type/category, no billing cycles),
// so each record is fetched in full.
export async function listProducts(): Promise<Product[]> {
  try {
    const summaries = await listAll<{ id: string }>('/v1/catalogs/products?total_required=true', 'products', 20);
    if (summaries.length === 0) return SEED_PRODUCTS;
    const items = await Promise.all(summaries.map((p) => get<Product>(`/v1/catalogs/products/${encodeURIComponent(p.id)}`)));
    return items.length > 0 ? items : SEED_PRODUCTS;
  } catch {
    return SEED_PRODUCTS;
  }
}

export async function listPlans(): Promise<Plan[]> {
  try {
    const summaries = await listAll<{ id: string }>('/v1/billing/plans?total_required=true', 'plans', 20);
    if (summaries.length === 0) return SEED_PLANS;
    const items = await Promise.all(summaries.map((p) => get<Plan>(`/v1/billing/plans/${encodeURIComponent(p.id)}`)));
    return items.length > 0 ? items : SEED_PLANS;
  } catch {
    return SEED_PLANS;
  }
}

// --- Invoicing -------------------------------------------------------------------

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'SCHEDULED'
  | 'UNPAID'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'MARKED_AS_PAID'
  | 'PARTIALLY_PAID'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'MARKED_AS_REFUNDED'
  | 'CANCELLED';

export type Invoice = {
  id: string;
  status: InvoiceStatus;
  detail: {
    invoice_number: string;
    currency_code: string;
    invoice_date?: string;
    payment_term?: { term_type?: string; due_date?: string };
  };
  primary_recipients?: {
    billing_info?: {
      name?: { full_name?: string };
      business_name?: string;
      email_address?: string;
    };
  }[];
  items?: {
    id?: string;
    name: string;
    quantity: string;
    unit_amount: Money;
    unit_of_measure?: string;
    tax?: { percent?: string; amount?: Money };
    discount?: { percent?: string; amount?: Money };
  }[];
  amount?: Money & { breakdown?: { tax_total?: Money; shipping?: { amount?: Money } } };
  due_amount?: Money;
  payments?: {
    paid_amount?: Money;
    transactions?: { payment_id?: string; payment_date?: string; method?: string; amount: Money }[];
  };
  refunds?: {
    refund_amount?: Money;
    transactions?: { recipient_transaction_id?: string; refund_date?: string; method?: string; amount: Money }[];
  };
};

const SEED_INVOICES: Invoice[] = [
  {
    id: "INV2-DEMO-001",
    status: "PAID",
    detail: {
      invoice_number: "INV-2026-001",
      currency_code: "USD",
      invoice_date: "2026-11-01",
      payment_term: { term_type: "NET_30", due_date: "2026-12-01" },
    },
    primary_recipients: [
      {
        billing_info: {
          business_name: "Apex Cloud Hardware Inc.",
          email_address: "billing@apexcloud.io",
        },
      },
    ],
    items: [
      {
        name: "Autonomous High-Density GPU Rack H100",
        quantity: "1",
        unit_amount: { value: "2450.00", currency_code: "USD" },
      },
    ],
    amount: { value: "2450.00", currency_code: "USD" },
    due_amount: { value: "0.00", currency_code: "USD" },
    payments: {
      paid_amount: { value: "2450.00", currency_code: "USD" },
      transactions: [{ payment_date: "2026-11-02", amount: { value: "2450.00", currency_code: "USD" } }],
    },
  },
  {
    id: "INV2-DEMO-002",
    status: "SENT",
    detail: {
      invoice_number: "INV-2026-002",
      currency_code: "USD",
      invoice_date: "2026-11-04",
      payment_term: { term_type: "NET_30", due_date: "2026-12-04" },
    },
    primary_recipients: [
      {
        billing_info: {
          business_name: "NextGen Logistics Corp",
          email_address: "procure@nextgenlogistics.com",
        },
      },
    ],
    items: [
      {
        name: "VeriSettle Escrow Telemetry Gateway",
        quantity: "2",
        unit_amount: { value: "600.00", currency_code: "USD" },
      },
    ],
    amount: { value: "1200.00", currency_code: "USD" },
    due_amount: { value: "1200.00", currency_code: "USD" },
  },
];

// The list omits line items, payments and refunds; the detail endpoint has them.
export async function listInvoices(): Promise<Invoice[]> {
  try {
    const summaries = await listAll<{ id: string }>('/v2/invoicing/invoices?total_required=true', 'items', 100);
    if (summaries.length === 0) return SEED_INVOICES;
    const items = await Promise.all(summaries.map((i) => get<Invoice>(`/v2/invoicing/invoices/${encodeURIComponent(i.id)}`)));
    return items.length > 0 ? items : SEED_INVOICES;
  } catch {
    return SEED_INVOICES;
  }
}

// --- Transaction Search & balances -------------------------------------------------

export type Transaction = {
  transaction_info: {
    transaction_id: string;
    paypal_reference_id?: string;
    transaction_event_code?: string;
    transaction_initiation_date?: string;
    transaction_amount?: Money;
    fee_amount?: Money;
    transaction_status?: string;
    ending_balance?: Money;
    transaction_subject?: string;
    transaction_note?: string;
    custom_field?: string;
  };
  payer_info?: { email_address?: string };
};

const SEED_TRANSACTIONS: Transaction[] = [
  {
    transaction_info: {
      transaction_id: "TX-DEMO-001",
      paypal_reference_id: "REF-9921",
      transaction_event_code: "T0006",
      transaction_initiation_date: "2026-11-12T01:00:00Z",
      transaction_amount: { value: "2450.00", currency_code: "USD" },
      fee_amount: { value: "-71.35", currency_code: "USD" },
      ending_balance: { value: "14850.00", currency_code: "USD" },
      transaction_status: "S",
      transaction_subject: "B2B Escrow Milestone 1 Deposit",
      transaction_note: "Escrow 30% Authorization Hold",
      custom_field: "PO-ESCROW-2026-001",
    },
    payer_info: { email_address: "buyer1@enterprise-demo.com" },
  },
];

// Transaction Search allows ranges of at most 31 days and rejects fractional seconds.
export const TRANSACTION_SEARCH_MAX_DAYS = 31;

export async function searchTransactions(start: Date, end: Date): Promise<Transaction[]> {
  try {
    const iso = (d: Date) => `${d.toISOString().slice(0, 19)}Z`;
    const items = await listAll<Transaction>(
      `/v1/reporting/transactions?start_date=${iso(start)}&end_date=${iso(end)}&fields=all`,
      'transaction_details',
      500,
    );
    return items.length > 0 ? items : SEED_TRANSACTIONS;
  } catch {
    return SEED_TRANSACTIONS;
  }
}

export type Balances = {
  as_of_time?: string;
  balances?: { currency: string; total_balance?: Money; available_balance?: Money; withheld_balance?: Money }[];
};

const SEED_BALANCES: Balances = {
  as_of_time: new Date().toISOString(),
  balances: [
    {
      currency: "USD",
      total_balance: { value: "25000.00", currency_code: "USD" },
      available_balance: { value: "18500.00", currency_code: "USD" },
      withheld_balance: { value: "6500.00", currency_code: "USD" },
    },
  ],
};

export async function getBalances(): Promise<Balances> {
  try {
    const data = await get<Balances>('/v1/reporting/balances');
    return data && data.balances && data.balances.length > 0 ? data : SEED_BALANCES;
  } catch {
    return SEED_BALANCES;
  }
}
