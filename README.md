# PayPal REST API data pages

A Next.js app that reads sandbox data from the [PayPal REST API](https://developer.paypal.com/api/rest/) with plain `fetch` (no PayPal SDK) and shows it in simple tables.

## Run locally

Requires Node.js 20.9 or later and a PayPal sandbox REST app ([developer.paypal.com](https://developer.paypal.com/dashboard/applications/sandbox)). The Transaction Search pages also need the app's **Transaction search** feature enabled.

```bash
npm install
cp env.example .env.local   # then fill in the values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Next.js only loads the dotted `.env.local`; it is git-ignored, so credentials stay out of the repo.

Other scripts: `npm run build` (production build), `npm run start` (serve the build), `npm run lint`.

## How it works

Every PayPal request lives in [`lib/paypal.ts`](lib/paypal.ts), a small `fetch` client. It exchanges the client ID and secret for an OAuth access token at `POST /v1/oauth2/token`, then calls the endpoint with `Authorization: Bearer <token>`. To keep the example simple it gets a new token for every request instead of caching it. Each page is a server component that calls one of the `lib/paypal.ts` functions and renders the result with [`app/data-table.tsx`](app/data-table.tsx). Pages call `await connection()` so they render per request with live data instead of being prerendered at build time.

## Data pages

| Page | `lib/paypal.ts` function | REST endpoint | Shows |
|---|---|---|---|
| [`/transactions`](app/transactions/page.tsx) | `getRecentTransactions()` | [`GET /v1/reporting/transactions`](https://developer.paypal.com/docs/api/transaction-search/v1/) | First 20 transactions from the last 30 days |
| [`/subscriptions`](app/subscriptions/page.tsx) | `getBillingPlans()` | [`GET /v1/billing/plans`](https://developer.paypal.com/docs/api/subscriptions/v1/) | First 20 subscription billing plans |
| [`/balances`](app/balances/page.tsx) | `getBalances()` | [`GET /v1/reporting/balances`](https://developer.paypal.com/docs/api/transaction-search/v1/) | Current balance per currency |

The examples below are real sandbox responses, exactly as the REST API returns them.

### `/transactions`

`GET /v1/reporting/transactions?start_date=…&end_date=…&fields=all&page_size=20` returns `transaction_details[]`. Transaction Search accepts at most a 31-day range, and new activity can take up to three hours to appear. `fields=all` adds `payer_info` and the other sections; without it only `transaction_info` is returned.

One `transaction_details` item (a payout):

```json
{
  "transaction_info": {
    "transaction_id": "10890159B0554833L",
    "paypal_reference_id": "1FX78001X2681601H",
    "paypal_reference_id_type": "TXN",
    "transaction_event_code": "T0001",
    "transaction_initiation_date": "2026-09-23T12:11:56Z",
    "transaction_updated_date": "2026-09-23T12:11:56Z",
    "transaction_amount": { "currency_code": "USD", "value": "-1.00" },
    "fee_amount": { "currency_code": "USD", "value": "-0.25" },
    "transaction_status": "P",
    "transaction_subject": "Probe payout",
    "transaction_note": "probe",
    "ending_balance": { "currency_code": "USD", "value": "4997.50" },
    "available_balance": { "currency_code": "USD", "value": "4997.50" },
    "custom_field": "probe-1",
    "protection_eligibility": "02",
    "instrument_type": "PayPal",
    "instrument_sub_type": "PayPal Wallet"
  },
  "payer_info": {
    "email_address": "probe-receiver@example.com",
    "phone_number": { "country_code": "1", "national_number": "2028188144" },
    "address_status": "N",
    "payer_name": {}
  },
  "shipping_info": { "name": "John, Doe" },
  "cart_info": {},
  "store_info": {},
  "auction_info": {},
  "incentive_info": {}
}
```

`transaction_event_code` is a [PayPal T-code](https://developer.paypal.com/docs/transaction-search/transaction-event-codes/) (`T0001` = payout). `transaction_status` is `S` success, `P` pending, `D` denied, `V` reversed or `F` partially refunded.

### `/subscriptions`

`GET /v1/billing/plans?page_size=20` with the header `Prefer: return=representation` returns `plans[]`. The `Prefer` header makes the list include `billing_cycles` and `payment_preferences`, which the default list response omits.

One `plans` item (a plan with a 30-day trial):

```json
{
  "id": "P-3RM52651TF551181NNKZ4BHQ",
  "version": 1,
  "product_id": "AGGRID-CLOUD-STORAGE",
  "name": "Cloud Storage Basic (100 GB)",
  "status": "ACTIVE",
  "description": "Cloud Storage: Cloud Storage Basic (100 GB)",
  "usage_type": "LICENSED",
  "billing_cycles": [
    {
      "frequency": { "interval_unit": "DAY", "interval_count": 30 },
      "tenure_type": "TRIAL",
      "sequence": 1,
      "total_cycles": 1
    },
    {
      "pricing_scheme": {
        "version": 1,
        "fixed_price": { "currency_code": "USD", "value": "2.99" },
        "create_time": "2026-09-23T12:05:50Z",
        "update_time": "2026-09-23T12:05:50Z"
      },
      "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
      "tenure_type": "REGULAR",
      "sequence": 2,
      "total_cycles": 0
    }
  ],
  "payment_preferences": {
    "service_type": "PREPAID",
    "auto_bill_outstanding": true,
    "setup_fee": { "currency_code": "USD", "value": "0.0" },
    "setup_fee_failure_action": "CONTINUE",
    "payment_failure_threshold": 3
  },
  "quantity_supported": false,
  "payee": {
    "merchant_id": "QXJYHKET9Y4VC",
    "display_data": {
      "business_email": "cs-sb-orpxl49532735@business.example.com",
      "business_phone": { "country_code": "1", "national_number": "202-806-4825" }
    }
  },
  "create_time": "2026-09-23T12:05:50Z",
  "update_time": "2026-09-23T12:05:50Z",
  "links": [
    {
      "href": "https://api.sandbox.paypal.com/v1/billing/plans/P-3RM52651TF551181NNKZ4BHQ",
      "rel": "self",
      "method": "GET",
      "encType": "application/json"
    }
  ]
}
```

`total_cycles: 0` on the `REGULAR` cycle means the plan bills until cancelled.

### `/balances`

`GET /v1/reporting/balances` returns the current balances. Add `?as_of_time=…` to get the balance at an earlier point in time.

```json
{
  "balances": [
    {
      "currency": "USD",
      "total_balance": { "currency_code": "USD", "value": "3537.71" },
      "available_balance": { "currency_code": "USD", "value": "3537.71" },
      "withheld_balance": { "currency_code": "USD", "value": "0.00" }
    }
  ],
  "account_id": "QXJYHKET9Y4VC",
  "as_of_time": "2026-09-30T05:59:59Z",
  "last_refresh_time": "2026-09-30T05:59:59Z"
}
```
