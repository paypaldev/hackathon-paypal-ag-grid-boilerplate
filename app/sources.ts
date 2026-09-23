export const SOURCES = [
  { href: "/products", label: "Products", summary: "Catalog products the billing plans sell." },
  { href: "/plans", label: "Plans", summary: "Subscription billing plans with trials, pricing and setup fees." },
  { href: "/invoices", label: "Invoices", summary: "Invoices across draft, scheduled, unpaid, paid, refunded and cancelled states." },
  { href: "/transactions", label: "Transactions", summary: "Account activity from Transaction Search, including the seeded payouts." },
] as const;

// Nav and home list the dashboard ahead of the raw data sources.
export const PAGES = [
  {
    href: "/dashboard",
    label: "Dashboard",
    summary: "AG Studio dashboard: revenue KPIs, receivables, payments and subscriptions, with cross-filtering.",
  },
  ...SOURCES,
] as const;
