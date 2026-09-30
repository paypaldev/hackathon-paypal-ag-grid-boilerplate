import { connection } from "next/server";
import { getBalances } from "@/lib/paypal";
import { DataTable, money } from "../data-table";

export default async function BalancesPage() {
  await connection();

  const result = await getBalances();

  return (
    <DataTable
      title={`Balances (account ${result.account_id}, as of ${result.as_of_time})`}
      columns={["Currency", "Primary", "Total", "Available", "Withheld"]}
      rows={result.balances.map((b) => ({
        key: b.currency,
        cells: [
          b.currency,
          b.primary ? "Yes" : "No",
          money(b.total_balance),
          money(b.available_balance),
          money(b.withheld_balance),
        ],
      }))}
    />
  );
}
