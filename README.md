This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## PayPal sandbox data

`.env.local` must define `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET` for a PayPal **sandbox** REST app with Subscriptions, Invoicing, Payouts and Transaction Search enabled, and `AG_STUDIO` with the AG Studio licence key.

Seed the sandbox (safe to re-run; existing data is skipped):

```bash
npm run seed                  # everything
npm run seed -- invoices      # or pick steps: catalog, invoices, payouts
```

| Page            | PayPal API                          | Seeded by                                       |
| --------------- | ----------------------------------- | ----------------------------------------------- |
| `/products`     | `GET /v1/catalogs/products`         | `catalog` (5 products)                          |
| `/plans`        | `GET /v1/billing/plans`             | `catalog` (17 plans)                            |
| `/invoices`     | `GET /v2/invoicing/invoices`        | `invoices` (16 invoices across all states)      |
| `/transactions` | `GET /v1/reporting/transactions`    | `payouts` (3 batches, 9 items)                  |

Each page renders the raw API records in AG Grid, with column groups mirroring the JSON nesting.
Payout transactions can take up to 3 hours to appear in Transaction Search.

After enabling a new feature on the PayPal app, run `npm run paypal:refresh-token`: PayPal keeps returning the
already-issued access token (without the new permission) until it expires, up to ~9 hours later. The running app
needs no restart: on a 403 it fetches a fresh token once before giving up.

## Analytics for AG Studio

`GET /api/studio-data` returns `{ data, unavailable, generated_at }`, where `data` is an AG Studio
`AgDataSourcesDefinition` built live from the sandbox. Pass it straight to `<AgStudio data={data} />`.

| Module                       | Provides                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/analytics/tables.ts`    | Flat typed rows: customers, products, plans, invoices, invoice_items, invoice_payments, transactions                                         |
| `lib/analytics/summaries.ts` | invoiceKpis, receivablesAging, monthlyActivity, customerSummary, paymentMethodMix, productPlanSummary, transactionSummary                     |
| `lib/analytics/studio.ts`    | `buildStudioData`: typed fields, relationships (star schema for cross-filtering), a calendar, expression measures, AI-facing descriptions    |
| `lib/analytics/index.ts`     | `loadPayPalSnapshot` (fetch) and `buildAnalyticsTables` (pure, `asOf` for reproducible aging)                                                |

Money is kept in each record's own currency (USD/EUR/GBP): PayPal's FX quote API isn't provisioned for this
sandbox, so group or filter by `currency` before summing. Sources the app lacks permission for (currently
Transaction Search) are omitted from `data` and listed in `unavailable`.

## Dashboard (`/dashboard`)

An AG Studio (`ag-studio` + `ag-studio-react` 3.0.0) report over the analytics data, licensed with `AG_STUDIO`
(passed from the server page to `AgStudioProvider`; front-end licence keys are visible to the browser by design).

| Page                  | Shows                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Revenue overview      | KPI tiles (invoiced with monthly sparkline, collected, outstanding, collection rate, days to pay), invoiced vs paid by month, status mix, customers |
| Receivables           | Outstanding, overdue, overdue share, aging buckets, outstanding by customer, open invoices by due date |
| Payments & line items | Refund rate, effective tax rate, net cash, payment methods, net cash by month, line items      |
| Subscription catalog  | Plan count, average monthly price and trial, monthly-normalised price range per product, plans by status, plan catalog |
| Transactions          | Transaction count, gross, fees, net, amount and fees by T-code category, status mix, ledger (shown only when Transaction Search is permitted) |

Money pages open with a Currency page filter set to USD. Clicking a chart bar or slice cross-filters the page;
the View/Edit toggle switches to Studio's builder (widget gallery, data panel, drag-and-drop layout). Studio has no
page navigation of its own, so the tabs above it call `api.setState` with a new `selectedPageId`. The report is
defined in `app/dashboard/report.ts`.

Studio's AI assistant (`AgStudioAiModule`) isn't enabled: it needs an LLM provider adapter and API key, ideally
proxied through this app's server so the key never reaches the browser.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
