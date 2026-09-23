import { searchTransactions } from "@/lib/paypal";
import DataSource from "../data-source";

// Transaction Search caps a query at 31 days.
const WINDOW_MS = 31 * 86_400_000;

export default function TransactionsPage() {
  return (
    <DataSource
      title="Transactions (last 31 days)"
      endpoints={["GET /v1/reporting/transactions?fields=all"]}
      load={async () => {
        const end = new Date();
        return searchTransactions(new Date(end.getTime() - WINDOW_MS), end);
      }}
    />
  );
}
