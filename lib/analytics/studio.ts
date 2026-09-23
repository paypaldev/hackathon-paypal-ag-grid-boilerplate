// Builds the `data` prop for AG Studio (`AgDataSourcesDefinition`) from the
// analytics tables. The result is plain JSON - no callbacks or Intl objects - so
// it can be produced server-side and passed to a client component or API response.
//
// Showcased Studio features:
// - Star schema + relationships -> cross-filtering (click a customer, every widget filters)
// - Calendar -> year/quarter/month/week/day and seasonality fragments on every fact date
// - Expressions -> measures (collection rate, overdue share, ...) and a calculated column
// - Table/field descriptions -> context for Studio's AI agent

import type {
  AgCalendar,
  AgDataSourcesDefinition,
  AgExpressionFieldDefinition,
  AgFieldDefinition,
  AgFormat,
  AgRelationDefinition,
  AgSimpleDataSourceDefinition,
} from "ag-studio";
import type { AnalyticsTables } from "./index.ts";

export const CALENDAR_ID = "calendar";

// Field shorthands: [id, format, description?, name?]
type FieldSpec = [id: string, format: AgFormat, description?: string, name?: string];

// Studio's default label is the raw id ("Issued_amount"); "issued_amount" -> "Issued Amount", "customer_id" -> "Customer ID".
// Pass `name` where the derived label would be ambiguous across tables (several have a `name` field).
function fields(specs: FieldSpec[]): AgFieldDefinition[] {
  return specs.map(([id, format, description, name]) => ({
    id,
    name: name ?? id
      .split("_")
      .map((word) => (word === "id" ? "ID" : word[0].toUpperCase() + word.slice(1)))
      .join(" "),
    format,
    ...(description && { description }),
  }));
}

const MONEY_NOTE = "In the row's `currency`; never sum across currencies.";

function source(
  id: string,
  name: string,
  description: string,
  data: AgSimpleDataSourceDefinition["data"],
  specs: FieldSpec[],
): AgSimpleDataSourceDefinition {
  return { id, name, description, data, fields: fields(specs) };
}

const manyToOne = (id: string, from: string, to: string, key: string): AgRelationDefinition => ({
  id,
  source: { tableId: from, fieldId: key },
  target: { tableId: to, fieldId: key },
  type: "many-to-one",
});

const bindCalendar = (tableId: string, fieldId: string, truncate?: "day"): AgRelationDefinition => ({
  id: `${tableId}-${fieldId}-calendar`,
  source: { tableId, fieldId },
  target: { calendarId: CALENDAR_ID },
  ...(truncate && { truncate }),
});

const sumOf = (id: string) => ({ id, aggregation: "sum" as const });

export function buildStudioData(tables: AnalyticsTables): AgDataSourcesDefinition {
  const sources: AgSimpleDataSourceDefinition[] = [
    // --- Dimensions ---
    source("customers", "Customers", "Invoice recipients, keyed by lower-cased email. Dimension shared by invoices and customer_summary.", tables.customers, [
      ["customer_id", "textFormat", "Lower-cased email; join key."],
      ["name", "textFormat", undefined, "Customer"],
      ["business_name", "textFormat"],
      ["email", "textFormat"],
    ]),
    source("products", "Products", "PayPal catalog products that subscription plans sell.", tables.products, [
      ["product_id", "textFormat"],
      ["name", "textFormat", undefined, "Product"],
      ["description", "textFormat"],
      ["type", "textFormat", "PHYSICAL, DIGITAL or SERVICE."],
      ["category", "textFormat"],
      ["created_at", "dateTimeFormat"],
      ["updated_at", "dateTimeFormat"],
    ]),

    // --- Facts ---
    source("plans", "Billing Plans", "Subscription billing plans. monthly_price normalises weekly/quarterly/annual pricing to one month so plans compare.", tables.plans, [
      ["plan_id", "textFormat"],
      ["product_id", "textFormat"],
      ["name", "textFormat", undefined, "Plan"],
      ["status", "textFormat", "ACTIVE, INACTIVE or CREATED (not yet active)."],
      ["billing_interval", "textFormat"],
      ["interval_unit", "textFormat"],
      ["interval_count", "integerFormat"],
      ["currency", "textFormat"],
      ["price", "currencyFormat", `Price per billing interval. ${MONEY_NOTE}`],
      ["monthly_price", "currencyFormat", `Price normalised to one month. ${MONEY_NOTE}`],
      ["annual_price", "currencyFormat", `monthly_price x 12. ${MONEY_NOTE}`],
      ["has_trial", "booleanFormat"],
      ["trial_days", "integerFormat"],
      ["setup_fee", "currencyFormat", MONEY_NOTE],
      ["created_at", "dateTimeFormat"],
    ]),
    source("invoices", "Invoices", "One row per PayPal invoice with derived receivables fields. Use issued_amount (not total) for invoiced revenue: drafts, scheduled and cancelled invoices are excluded from it.", tables.invoices, [
      ["invoice_id", "textFormat"],
      ["invoice_number", "textFormat"],
      ["status", "textFormat", "Raw PayPal status."],
      ["status_group", "textFormat", "Draft, Scheduled, Open, Partially paid, Paid, Refunded or Cancelled."],
      ["is_issued", "booleanFormat", "Sent and not cancelled."],
      ["is_receivable", "booleanFormat", "Issued with money still owed."],
      ["customer_id", "textFormat"],
      ["currency", "textFormat"],
      ["payment_term", "textFormat"],
      ["invoice_date", "dateFormat"],
      ["due_date", "dateFormat"],
      ["created_at", "dateTimeFormat", "When the record was created in PayPal (not the business date)."],
      ["item_count", "integerFormat"],
      ["item_subtotal", "currencyFormat", `Sum of line quantity x price before discounts. ${MONEY_NOTE}`],
      ["discount_total", "currencyFormat", MONEY_NOTE],
      ["tax_total", "currencyFormat", MONEY_NOTE],
      ["shipping", "currencyFormat", MONEY_NOTE],
      ["total", "currencyFormat", MONEY_NOTE],
      ["issued_amount", "currencyFormat", `total when issued, else 0. ${MONEY_NOTE}`],
      ["paid_amount", "currencyFormat", MONEY_NOTE],
      ["refunded_amount", "currencyFormat", MONEY_NOTE],
      ["net_collected", "currencyFormat", `paid - refunded. ${MONEY_NOTE}`],
      ["outstanding", "currencyFormat", `Still owed on receivable invoices. ${MONEY_NOTE}`],
      ["is_overdue", "booleanFormat"],
      ["days_overdue", "integerFormat"],
      ["overdue_amount", "currencyFormat", MONEY_NOTE],
      ["aging_bucket", "textFormat", "Not yet due, 1-30, 31-60, 61-90 or 90+ days overdue."],
      ["first_payment_date", "dateFormat"],
      ["days_to_first_payment", "integerFormat", "Days from invoice date to first recorded payment."],
    ]),
    source("invoice_items", "Invoice Line Items", "Invoice lines. line_total excludes invoice-level discounts and shipping, so it won't reconcile exactly to invoices.total.", tables.invoice_items, [
      ["item_id", "textFormat"],
      ["invoice_id", "textFormat"],
      ["line_no", "integerFormat"],
      ["currency", "textFormat"],
      ["name", "textFormat", undefined, "Item"],
      ["description", "textFormat"],
      ["unit_of_measure", "textFormat", "QUANTITY, HOURS or AMOUNT."],
      ["quantity", "decimalFormat"],
      ["unit_price", "currencyFormat", MONEY_NOTE],
      ["gross", "currencyFormat", `quantity x unit_price. ${MONEY_NOTE}`],
      ["discount_percent", "decimalFormat"],
      ["discount_amount", "currencyFormat", MONEY_NOTE],
      ["tax_name", "textFormat"],
      ["tax_percent", "decimalFormat"],
      ["tax_amount", "currencyFormat", MONEY_NOTE],
      ["line_total", "currencyFormat", MONEY_NOTE],
    ]),
    source("invoice_payments", "Invoice Payments & Refunds", "Payments and refunds recorded against invoices. Sum signed_amount for net cash.", tables.invoice_payments, [
      ["payment_id", "textFormat"],
      ["invoice_id", "textFormat"],
      ["customer_id", "textFormat"],
      ["kind", "textFormat", "Payment or Refund."],
      ["method", "textFormat"],
      ["payment_date", "dateFormat"],
      ["currency", "textFormat"],
      ["amount", "currencyFormat", MONEY_NOTE],
      ["signed_amount", "currencyFormat", `Refunds negative. ${MONEY_NOTE}`],
      ["note", "textFormat"],
    ]),

    // --- Pre-aggregated summaries ---
    source("invoice_kpis", "Invoice KPIs", "One headline row per currency; source for KPI tiles.", tables.invoice_kpis, [
      ["currency", "textFormat"],
      ["invoices", "integerFormat"],
      ["issued_invoices", "integerFormat"],
      ["unsent_invoices", "integerFormat"],
      ["open_invoices", "integerFormat"],
      ["overdue_invoices", "integerFormat"],
      ["paid_invoices", "integerFormat"],
      ["cancelled_invoices", "integerFormat"],
      ["issued_amount", "currencyFormat"],
      ["paid_amount", "currencyFormat"],
      ["refunded_amount", "currencyFormat"],
      ["net_collected", "currencyFormat"],
      ["outstanding", "currencyFormat"],
      ["overdue_amount", "currencyFormat"],
      ["average_invoice", "currencyFormat"],
      ["collection_rate", "percentageFormat", "paid / issued."],
      ["avg_days_to_pay", "decimalFormat"],
    ]),
    source("receivables_aging", "Receivables Aging", "Outstanding receivables per aging bucket and currency, all buckets present. Sort by bucket_order.", tables.receivables_aging, [
      ["currency", "textFormat"],
      ["aging_bucket", "textFormat"],
      ["bucket_order", "integerFormat"],
      ["invoices", "integerFormat"],
      ["outstanding", "currencyFormat"],
    ]),
    source("monthly_activity", "Monthly Activity", "Invoiced (by invoice date) vs collected and refunded (by payment date) per month and currency, empty months zero-filled.", tables.monthly_activity, [
      ["month", "dateFormat", "First day of the month."],
      ["currency", "textFormat"],
      ["invoices_issued", "integerFormat"],
      ["invoiced_amount", "currencyFormat"],
      ["collected_amount", "currencyFormat"],
      ["refunded_amount", "currencyFormat"],
      ["net_cash", "currencyFormat"],
    ]),
    source("customer_summary", "Customer Summary", "Lifetime totals and payment behaviour per customer and currency.", tables.customer_summary, [
      ["customer_id", "textFormat"],
      ["customer_name", "textFormat"],
      ["business_name", "textFormat"],
      ["currency", "textFormat"],
      ["invoices", "integerFormat"],
      ["issued_amount", "currencyFormat"],
      ["paid_amount", "currencyFormat"],
      ["refunded_amount", "currencyFormat"],
      ["outstanding", "currencyFormat"],
      ["overdue_amount", "currencyFormat"],
      ["first_invoice_date", "dateFormat"],
      ["last_invoice_date", "dateFormat"],
      ["avg_days_to_pay", "decimalFormat"],
    ]),
    source("payment_method_mix", "Payment Method Mix", "Payment and refund counts and amounts per method and currency.", tables.payment_method_mix, [
      ["currency", "textFormat"],
      ["kind", "textFormat"],
      ["method", "textFormat"],
      ["payments", "integerFormat"],
      ["amount", "currencyFormat"],
    ]),
    source("product_plan_summary", "Product Plan Summary", "Plan counts and monthly-normalised price range per product.", tables.product_plan_summary, [
      ["product_id", "textFormat"],
      ["product_name", "textFormat"],
      ["currency", "textFormat"],
      ["plans", "integerFormat"],
      ["active_plans", "integerFormat"],
      ["plans_with_trial", "integerFormat"],
      ["plans_with_setup_fee", "integerFormat"],
      ["min_monthly_price", "currencyFormat"],
      ["avg_monthly_price", "currencyFormat"],
      ["max_monthly_price", "currencyFormat"],
    ]),
  ];

  const relationships: AgRelationDefinition[] = [
    manyToOne("plans-products", "plans", "products", "product_id"),
    manyToOne("product_plan_summary-products", "product_plan_summary", "products", "product_id"),
    manyToOne("invoices-customers", "invoices", "customers", "customer_id"),
    manyToOne("customer_summary-customers", "customer_summary", "customers", "customer_id"),
    manyToOne("invoice_items-invoices", "invoice_items", "invoices", "invoice_id"),
    manyToOne("invoice_payments-invoices", "invoice_payments", "invoices", "invoice_id"),
    bindCalendar("invoices", "invoice_date"),
    bindCalendar("invoice_payments", "payment_date"),
    bindCalendar("monthly_activity", "month"),
  ];

  const dates = [
    ...tables.invoices.map((row) => row.invoice_date),
    ...tables.invoice_payments.map((row) => row.payment_date),
  ];

  if (tables.transactions) {
    sources.push(
      source("transactions", "Transactions", "PayPal account activity from Transaction Search. amount and fee are signed (debits negative); net = amount + fee.", tables.transactions, [
        ["transaction_id", "textFormat"],
        ["event_code", "textFormat", "PayPal T-code."],
        ["event_description", "textFormat"],
        ["event_category", "textFormat", "T-code category from PayPal's reference."],
        ["status", "textFormat"],
        ["direction", "textFormat", "Credit or Debit."],
        ["initiated_at", "dateTimeFormat"],
        ["updated_at", "dateTimeFormat"],
        ["currency", "textFormat"],
        ["amount", "currencyFormat", MONEY_NOTE],
        ["fee", "currencyFormat", MONEY_NOTE],
        ["net", "currencyFormat", MONEY_NOTE],
        ["counterparty_email", "textFormat"],
        ["counterparty_name", "textFormat"],
        ["subject", "textFormat"],
        ["note", "textFormat"],
        ["reference_id", "textFormat"],
      ]),
      source("transaction_summary", "Transaction Summary", "Transaction counts, gross, fees and net per T-code category, status and currency.", tables.transaction_summary ?? [], [
        ["currency", "textFormat"],
        ["event_category", "textFormat"],
        ["status", "textFormat"],
        ["transactions", "integerFormat"],
        ["gross", "currencyFormat"],
        ["fees", "currencyFormat"],
        ["net", "currencyFormat"],
      ]),
    );
    relationships.push(bindCalendar("transactions", "initiated_at", "day"));
    dates.push(...tables.transactions.map((row) => row.initiated_at?.slice(0, 10) ?? null));
  }

  const sortedDates = dates.filter((date) => date !== null).sort();
  const today = new Date().toISOString().slice(0, 10);
  const calendars: AgCalendar[] = [
    {
      id: CALENDAR_ID,
      label: "Calendar",
      range: {
        from: { type: "date", value: sortedDates[0] ?? today },
        to: { type: "date", value: sortedDates[sortedDates.length - 1] ?? today },
      },
      fragments: ["year", "quarter", "month", "week", "day", "monthOfYear", "dayOfWeek"],
    },
  ];

  const expressions: AgExpressionFieldDefinition[] = [
    {
      id: "collection_rate",
      name: "Collection Rate",
      description: "Paid / issued invoice amount. Filter to one currency for a meaningful ratio.",
      format: "percentageFormat",
      isMeasure: true,
      expression: { operator: "divide", inputs: [sumOf("invoices.paid_amount"), sumOf("invoices.issued_amount")] },
    },
    {
      id: "overdue_share",
      name: "Overdue Share",
      description: "Share of outstanding receivables that is past due.",
      format: "percentageFormat",
      isMeasure: true,
      expression: { operator: "divide", inputs: [sumOf("invoices.overdue_amount"), sumOf("invoices.outstanding")] },
    },
    {
      id: "refund_rate",
      name: "Refund Rate",
      description: "Refunded / paid invoice amount.",
      format: "percentageFormat",
      isMeasure: true,
      expression: { operator: "divide", inputs: [sumOf("invoices.refunded_amount"), sumOf("invoices.paid_amount")] },
    },
    {
      id: "effective_tax_rate",
      name: "Effective Tax Rate",
      description: "Tax / item subtotal across invoices.",
      format: "percentageFormat",
      isMeasure: true,
      expression: { operator: "divide", inputs: [sumOf("invoices.tax_total"), sumOf("invoices.item_subtotal")] },
    },
    {
      id: "days_until_due",
      name: "Days Until Due",
      description: "Days from today to the invoice due date; negative when past due.",
      format: "integerFormat",
      isMeasure: false,
      expression: {
        operator: "datediff",
        inputs: [{ type: "string", value: "day" }, { operator: "currentDate", inputs: [] }, { id: "invoices.due_date" }],
      },
    },
  ];

  return {
    description:
      "PayPal sandbox data for a merchant selling subscriptions (catalog products and billing plans) and sending invoices. " +
      "Invoices, payments and refunds are in USD, EUR or GBP and are NOT converted: always group or filter by currency before summing money. " +
      "Invoice statuses roll up into status_group; receivables are Open or Partially paid invoices. " +
      "Payments on invoices are recorded externally (bank transfer, check, card, cash), not PayPal checkouts. " +
      (tables.transactions
        ? "Transactions come from PayPal Transaction Search and include payouts."
        : "Transaction Search data is unavailable for this account."),
    sources,
    relationships,
    calendars,
    expressions,
  };
}
