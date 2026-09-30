import { connection } from "next/server";
import { getBillingPlans } from "@/lib/paypal";
import { DataTable, money } from "../data-table";

export default async function SubscriptionsPage() {
  await connection();

  const plans = await getBillingPlans();

  return (
    <DataTable
      title="Subscription billing plans"
      columns={["Name", "Product", "Status", "Price", "Billed every", "Trial", "Setup fee", "Created", "ID"]}
      rows={plans.map((plan) => {
        const regular = plan.billing_cycles?.find((c) => c.tenure_type === "REGULAR");
        const trial = plan.billing_cycles?.find((c) => c.tenure_type === "TRIAL");
        return {
          key: plan.id,
          cells: [
            plan.name,
            plan.product_id,
            plan.status,
            money(regular?.pricing_scheme?.fixed_price),
            regular && `${regular.frequency.interval_count ?? 1} ${regular.frequency.interval_unit}`,
            trial
              ? `${(trial.total_cycles ?? 1) * (trial.frequency.interval_count ?? 1)} ${trial.frequency.interval_unit}`
              : "None",
            money(plan.payment_preferences?.setup_fee),
            plan.create_time?.slice(0, 10),
            plan.id,
          ],
        };
      })}
    />
  );
}
