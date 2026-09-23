import { listPlanDetails } from "@/lib/paypal";
import DataSource from "../data-source";

export default function PlansPage() {
  return (
    <DataSource
      title="Billing Plans"
      endpoints={["GET /v1/billing/plans", "GET /v1/billing/plans/{id}"]}
      load={listPlanDetails}
    />
  );
}
