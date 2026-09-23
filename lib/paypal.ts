// Minimal PayPal REST client shared by the Next.js app (server-side only) and
// the seed script (run directly by Node, so this file must stay free of
// non-erasable TypeScript syntax and Next.js-only imports).

const BASE_URL = "https://api-m.sandbox.paypal.com";
const MAX_ATTEMPTS = 4;

export class PayPalError extends Error {
  status: number;
  debugId: string | undefined;
  issue: string | undefined;

  constructor(status: number, body: PayPalErrorBody, debugId: string | undefined) {
    const detail = body.details?.[0];
    const issue = detail?.issue ?? body.name ?? body.error;
    const description =
      detail?.description ?? body.message ?? body.error_description ?? "Request failed";
    super(`PayPal ${status} ${issue ?? ""}: ${description} (debug_id: ${debugId ?? "n/a"})`);
    this.name = "PayPalError";
    this.status = status;
    this.debugId = debugId;
    this.issue = issue;
  }
}

type PayPalErrorBody = {
  name?: string;
  message?: string;
  debug_id?: string;
  details?: { issue?: string; description?: string }[];
  error?: string;
  error_description?: string;
};

let cachedToken: { value: string; expiresAt: number } | undefined;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set (see .env.local)");
  }

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw await toError(res);

  const { access_token, expires_in } = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  // Refresh a minute early so an in-flight request never carries an expired token.
  cachedToken = { value: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
  return access_token;
}

async function toError(res: Response): Promise<PayPalError> {
  const body = (await res.json().catch(() => ({}))) as PayPalErrorBody;
  return new PayPalError(res.status, body, res.headers.get("paypal-debug-id") ?? body.debug_id);
}

export async function paypalRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  requestId: string = crypto.randomUUID(),
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${await getAccessToken()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
    // Same id on every retry so PayPal de-duplicates the write.
    if (method === "POST") headers["PayPal-Request-Id"] = requestId;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    if (res.ok) {
      // Some writes (e.g. invoice cancel) answer 204 with no body.
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }

    // 401: token expired/revoked. 403: the cached token may predate a permission newly granted to
    // the app (tokens keep the scopes they were issued with), so fetch a fresh one once.
    if ((res.status === 401 || res.status === 403) && attempt === 1) {
      cachedToken = undefined;
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 2 ** attempt * 250);
      await promise;
      continue;
    }
    throw await toError(res);
  }
}

// --- Pagination -------------------------------------------------------------

type Page = { total_pages?: number };

// `path` must carry whatever flags make the endpoint report `total_pages`.
async function listAll<T>(path: string, key: string, pageSize: number): Promise<T[]> {
  const items: T[] = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; ; page++) {
    const res = await paypalRequest<Page & Record<string, T[] | undefined>>(
      "GET",
      `${path}${sep}page_size=${pageSize}&page=${page}`,
    );
    items.push(...(res[key] ?? []));
    if (page >= (res.total_pages ?? 1)) return items;
  }
}

// --- Catalog Products & Billing Plans --------------------------------------

export type ProductType = "PHYSICAL" | "DIGITAL" | "SERVICE";

export type Product = {
  id: string;
  name: string;
  description?: string;
  type?: ProductType;
  category?: string;
  create_time: string;
  update_time?: string;
};

export type Money = { value: string; currency_code: string };

export type IntervalUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

export type BillingCycle = {
  frequency: { interval_unit: IntervalUnit; interval_count: number };
  tenure_type: "REGULAR" | "TRIAL";
  sequence: number;
  total_cycles: number;
  pricing_scheme?: { fixed_price?: Money };
};

export type PlanStatus = "CREATED" | "INACTIVE" | "ACTIVE";

export type PlanSummary = {
  id: string;
  product_id: string;
  name: string;
  status: PlanStatus;
  description?: string;
  create_time: string;
};

export type Plan = PlanSummary & {
  usage_type?: string;
  billing_cycles: BillingCycle[];
  payment_preferences?: { setup_fee?: Money };
};

export function listProducts(): Promise<Product[]> {
  return listAll<Product>("/v1/catalogs/products?total_required=true", "products", 20);
}

export function listPlans(productId?: string): Promise<PlanSummary[]> {
  const filter = productId ? `&product_id=${encodeURIComponent(productId)}` : "";
  return listAll<PlanSummary>(`/v1/billing/plans?total_required=true${filter}`, "plans", 20);
}

export function getPlan(id: string): Promise<Plan> {
  return paypalRequest<Plan>("GET", `/v1/billing/plans/${encodeURIComponent(id)}`);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  try {
    return await paypalRequest<Product>("GET", `/v1/catalogs/products/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof PayPalError && err.status === 404) return undefined;
    throw err;
  }
}

// The list endpoints return summaries; these fetch every record's full detail.

export async function listProductDetails(): Promise<Product[]> {
  const products = await Promise.all((await listProducts()).map((p) => getProduct(p.id)));
  return products.filter((product) => product !== undefined);
}

export async function listPlanDetails(): Promise<Plan[]> {
  return Promise.all((await listPlans()).map((plan) => getPlan(plan.id)));
}

// --- Invoicing ----------------------------------------------------------------

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "SCHEDULED"
  | "UNPAID"
  | "PAYMENT_PENDING"
  | "PAID"
  | "MARKED_AS_PAID"
  | "PARTIALLY_PAID"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "MARKED_AS_REFUNDED"
  | "CANCELLED";

type InvoiceTransaction = { amount: Money; method?: string; note?: string; type?: string };

// List responses carry only `id`, `status`, `detail` basics and amounts; the
// remaining fields are present on the detail endpoint.
export type Invoice = {
  id: string;
  status: InvoiceStatus;
  detail: {
    invoice_number: string;
    currency_code: string;
    invoice_date?: string;
    payment_term?: { term_type?: string; due_date?: string };
    metadata?: { create_time?: string };
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
    description?: string;
    quantity: string;
    unit_amount: Money;
    unit_of_measure?: string;
    tax?: { name?: string; percent?: string; amount?: Money };
    discount?: { percent?: string; amount?: Money };
  }[];
  amount?: Money & {
    breakdown?: {
      item_total?: Money;
      discount?: { invoice_discount?: { amount?: Money }; item_discount?: Money };
      tax_total?: Money;
      shipping?: { amount?: Money };
    };
  };
  due_amount?: Money;
  payments?: {
    paid_amount?: Money;
    transactions?: (InvoiceTransaction & { payment_id?: string; payment_date?: string })[];
  };
  refunds?: {
    refund_amount?: Money;
    transactions?: (InvoiceTransaction & {
      recipient_transaction_id?: string;
      refund_date?: string;
    })[];
  };
};

export function listInvoices(): Promise<Invoice[]> {
  return listAll<Invoice>("/v2/invoicing/invoices?total_required=true&fields=amount", "items", 100);
}

export function getInvoice(id: string): Promise<Invoice> {
  return paypalRequest<Invoice>("GET", `/v2/invoicing/invoices/${encodeURIComponent(id)}`);
}

export async function listInvoiceDetails(): Promise<Invoice[]> {
  return Promise.all((await listInvoices()).map((invoice) => getInvoice(invoice.id)));
}

// --- Transaction Search -----------------------------------------------------

// Fields per https://developer.paypal.com/docs/api/transaction-search/v1/ (fields=all).
export type TransactionDetail = {
  transaction_info: {
    transaction_id: string;
    paypal_reference_id?: string;
    transaction_event_code?: string;
    transaction_initiation_date?: string;
    transaction_updated_date?: string;
    transaction_amount?: Money;
    fee_amount?: Money;
    transaction_status?: string;
    transaction_subject?: string;
    transaction_note?: string;
  };
  payer_info?: {
    email_address?: string;
    payer_name?: { alternate_full_name?: string; given_name?: string; surname?: string };
  };
};

// Transaction Search accepts ranges of at most 31 days, and new activity can take
// up to three hours to become searchable.
export function searchTransactions(start: Date, end: Date): Promise<TransactionDetail[]> {
  // PayPal rejects fractional seconds.
  const range = `start_date=${start.toISOString().slice(0, 19)}Z&end_date=${end.toISOString().slice(0, 19)}Z`;
  return listAll<TransactionDetail>(
    `/v1/reporting/transactions?${range}&fields=all`,
    "transaction_details",
    500,
  );
}
