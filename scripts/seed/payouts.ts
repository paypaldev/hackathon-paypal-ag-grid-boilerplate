// Payouts are the only way to create real money movement in this sandbox app
// without a buyer approving in a browser (card capture needs Advanced Card
// Processing). Each payout item becomes a transaction in Transaction Search.
// Fixed sender_batch_ids make re-runs no-ops.

import { PayPalError, paypalRequest } from "../../lib/paypal.ts";

type PayoutItem = { receiver: string; amount: string; note: string };

type BatchSeed = { id: string; subject: string; items: PayoutItem[] };

const SEED: BatchSeed[] = [
  {
    id: "AGGRID-AFFILIATES-2026-09",
    subject: "Your affiliate commission",
    items: [
      { receiver: "affiliate.north@example.com", amount: "125.40", note: "September affiliate commission" },
      { receiver: "affiliate.south@example.com", amount: "88.15", note: "September affiliate commission" },
      { receiver: "affiliate.east@example.com", amount: "342.00", note: "September affiliate commission" },
      { receiver: "affiliate.west@example.com", amount: "19.99", note: "September affiliate commission" },
    ],
  },
  {
    id: "AGGRID-CREATORS-2026-09",
    subject: "Creator fund payout",
    items: [
      { receiver: "creator.aurora@example.com", amount: "500.00", note: "Creator fund: tier Gold" },
      { receiver: "creator.basil@example.com", amount: "250.00", note: "Creator fund: tier Silver" },
      { receiver: "creator.cleo@example.com", amount: "75.50", note: "Creator fund: tier Bronze" },
    ],
  },
  {
    id: "AGGRID-REFUNDS-2026-09",
    subject: "Goodwill credit",
    items: [
      { receiver: "customer.delay@example.com", amount: "15.00", note: "Apology credit for delayed shipment" },
      { receiver: "customer.damage@example.com", amount: "42.75", note: "Credit for damaged item" },
    ],
  },
];

type PayoutBatch = { batch_header: { payout_batch_id: string; batch_status: string } };

export async function seedPayouts(): Promise<void> {
  for (const batch of SEED) {
    try {
      const res = await paypalRequest<PayoutBatch>(
        "POST",
        "/v1/payments/payouts",
        {
          sender_batch_header: {
            sender_batch_id: batch.id,
            email_subject: batch.subject,
            email_message: "Thanks for being part of the program.",
          },
          items: batch.items.map((item, i) => ({
            recipient_type: "EMAIL",
            receiver: item.receiver,
            amount: { value: item.amount, currency: "USD" },
            note: item.note,
            sender_item_id: `${batch.id}-${i + 1}`,
          })),
        },
        `seed-payout-${batch.id}`,
      );
      console.log(
        `+ payout batch ${batch.id} ${res.batch_header.payout_batch_id} [${res.batch_header.batch_status}]`,
      );
    } catch (err) {
      // Payouts reports this as USER_BUSINESS_ERROR with the reason only in the detail text.
      if (err instanceof PayPalError && err.issue?.includes("sender_batch_id already exists")) {
        console.log(`= payout batch ${batch.id} exists`);
        continue;
      }
      throw err;
    }
  }
}
