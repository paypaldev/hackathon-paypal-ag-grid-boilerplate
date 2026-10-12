// PayPal sandbox client used only by the seed scripts. It intentionally has no
// dependency on the application's PayPal client.

const BASE_URL = "https://api-m.sandbox.paypal.com";
const MAX_ATTEMPTS = 4;

type PayPalErrorBody = {
  name?: string;
  message?: string;
  debug_id?: string;
  details?: { issue?: string; description?: string }[];
  error?: string;
  error_description?: string;
};

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

let cachedToken: { value: string; expiresAt: number } | undefined;

async function toError(response: Response): Promise<PayPalError> {
  const body = (await response.json().catch(() => ({}))) as PayPalErrorBody;
  return new PayPalError(
    response.status,
    body,
    response.headers.get("paypal-debug-id") ?? body.debug_id,
  );
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_SECRET must be set (see .env.local)");
  }

  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw await toError(response);

  const token = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: token.access_token,
    expiresAt: Date.now() + (token.expires_in - 60) * 1000,
  };
  return token.access_token;
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
    if (method === "POST") headers["PayPal-Request-Id"] = requestId;

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    if (response.ok) {
      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }

    if ((response.status === 401 || response.status === 403) && attempt === 1) {
      cachedToken = undefined;
      continue;
    }
    if ((response.status === 429 || response.status >= 500) && attempt < MAX_ATTEMPTS) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 2 ** attempt * 250);
      await promise;
      continue;
    }
    throw await toError(response);
  }
}

type Page = { total_pages?: number };

async function listAll<T>(path: string, key: string, pageSize: number): Promise<T[]> {
  const items: T[] = [];
  const separator = path.includes("?") ? "&" : "?";

  for (let page = 1; ; page++) {
    const response = await paypalRequest<Page & Record<string, T[] | undefined>>(
      "GET",
      `${path}${separator}page_size=${pageSize}&page=${page}`,
    );
    items.push(...(response[key] ?? []));
    if (page >= (response.total_pages ?? 1)) return items;
  }
}

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

type PlanSummary = {
  id: string;
  product_id: string;
  name: string;
  status: PlanStatus;
};

export function listPlans(productId?: string): Promise<PlanSummary[]> {
  const filter = productId ? `&product_id=${encodeURIComponent(productId)}` : "";
  return listAll<PlanSummary>(
    `/v1/billing/plans?total_required=true${filter}`,
    "plans",
    20,
  );
}

export async function getProduct(id: string): Promise<Product | undefined> {
  try {
    return await paypalRequest<Product>(
      "GET",
      `/v1/catalogs/products/${encodeURIComponent(id)}`,
    );
  } catch (error) {
    if (error instanceof PayPalError && error.status === 404) return undefined;
    throw error;
  }
}

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

export type Invoice = {
  id: string;
  status: InvoiceStatus;
  detail: {
    invoice_number: string;
    currency_code: string;
    invoice_date?: string;
  };
  amount?: Money;
};

export function listInvoices(): Promise<Invoice[]> {
  return listAll<Invoice>(
    "/v2/invoicing/invoices?total_required=true&fields=amount",
    "items",
    100,
  );
}
