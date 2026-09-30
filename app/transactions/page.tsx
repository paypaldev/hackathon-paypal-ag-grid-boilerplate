import { connection } from "next/server";
import { getRecentTransactions } from "@/lib/paypal";
import { DataTable, money } from "../data-table";

export default async function TransactionsPage() {
  await connection();
  const transactions = await getRecentTransactions();

  return (
    <DataTable
      title="Transactions (last 30 days)"
      columns={["Date", "Type", "Status", "Amount", "Fee", "Ending balance", "Counterparty", "Subject", "Instrument", "ID"]}
      rows={transactions.map(({ transaction_info: t, payer_info: p }) => ({
        key: t.transaction_id,
        cells: [
          t.transaction_initiation_date?.slice(0, 10),
          t.transaction_event_code,
          t.transaction_status,
          money(t.transaction_amount),
          money(t.fee_amount),
          money(t.ending_balance),
          p?.email_address,
          t.transaction_subject,
          t.instrument_sub_type,
          t.transaction_id,
        ],
      }))}
    />
  );
}
