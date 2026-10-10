// Minimal PayPal REST API client (sandbox). Server-side only: it uses the app secret.

const BASE_URL = 'https://api-m.sandbox.paypal.com';

// Response types cover only the fields the pages use.
// Full schemas: https://developer.paypal.com/api/rest/

export type Money = { value: string; currency_code: string };

export type Transaction = {
  transaction_info: {
    transaction_id: string;
    transaction_event_code?: string;
    transaction_initiation_date?: string;
    transaction_amount?: Money;
    fee_amount?: Money;
    transaction_status?: string;
    transaction_subject?: string;
    ending_balance?: Money;
    instrument_sub_type?: string;
  };
  payer_info?: { email_address?: string };
};

type BillingCycle = {
  tenure_type: 'REGULAR' | 'TRIAL';
  frequency: { interval_unit: string; interval_count?: number };
  total_cycles?: number;
  pricing_scheme?: { fixed_price?: Money };
};

export type Plan = {
  id: string;
  product_id: string;
  name: string;
  status: string;
  create_time?: string;
  billing_cycles?: BillingCycle[];
  payment_preferences?: { setup_fee?: Money };
};

export type Balances = {
  account_id: string;
  as_of_time: string;
  balances: {
    currency: string;
    primary?: boolean;
    total_balance: Money;
    available_balance?: Money;
    withheld_balance?: Money;
  }[];
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  type?: string; // PHYSICAL, DIGITAL or SERVICE
  category?: string;
  create_time?: string;
};

export type Invoice = {
  id: string;
  status: string;
  detail: {
    invoice_number: string;
    currency_code: string;
    invoice_date?: string;
    payment_term?: { due_date?: string };
  };
  primary_recipients?: {
    billing_info?: {
      name?: { full_name?: string };
      business_name?: string;
      email_address?: string;
    };
  }[];
  amount?: Money;
  due_amount?: Money;
  payments?: { paid_amount?: Money };
  refunds?: { refund_amount?: Money };
};

// Exchange the app's client ID and secret for an access token.
// Kept simple: a new token per request, no caching, so expiry never applies
// (tokens live ~9h; each is used immediately). Costs one extra OAuth round trip
// per API call. If you add caching, refresh before `expires_in` and retry once
// on 401, or stale tokens will make every paypalGet throw.
async function getAccessToken(): Promise<string> {
  const credentials = btoa(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`);
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  const { access_token } = await res.json();
  return access_token;
}

async function paypalGet<T>(
  path: string,
  params: Record<string, string> = {},
  headers: Record<string, string> = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${await getAccessToken()}`, ...headers },
  });
  if (!res.ok) throw new Error(`PayPal GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// Transactions from the last 30 days (Transaction Search allows at most 31).
export async function getRecentTransactions() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const result = await paypalGet<{ transaction_details?: Transaction[] }>('/v1/reporting/transactions', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    fields: 'all', // include payer info, not just transaction info
    page_size: '20',
  });
  return result.transaction_details ?? [];
}

// Prefer: return=representation includes billing cycles and payment preferences in the list.
export async function getBillingPlans() {
  const result = await paypalGet<{ plans?: Plan[] }>(
    '/v1/billing/plans',
    { page_size: '20' },
    { Prefer: 'return=representation' },
  );
  return result.plans ?? [];
}

export function getBalances() {
  return paypalGet<Balances>('/v1/reporting/balances');
}

// Prefer: return=representation includes type and category in the list.
export async function getProducts() {
  const result = await paypalGet<{ products?: Product[] }>(
    '/v1/catalogs/products',
    { page_size: '20' },
    { Prefer: 'return=representation' },
  );
  return result.products ?? [];
}

// The list has totals (amount, paid, refunded, due) but not line items or individual
// payments; those need GET /v2/invoicing/invoices/{id}.
export async function getInvoices() {
  const result = await paypalGet<{ items?: Invoice[] }>('/v2/invoicing/invoices', { page_size: '20' });
  return result.items ?? [];
}
