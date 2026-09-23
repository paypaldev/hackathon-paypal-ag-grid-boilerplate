import { connection } from "next/server";
import { buildAnalyticsTables, loadPayPalSnapshot } from "@/lib/analytics";
import { buildStudioData } from "@/lib/analytics/studio";
import StudioDashboard from "./studio-dashboard";

export default async function DashboardPage() {
  // PayPal data is live; render per request instead of at build time.
  await connection();
  const asOf = new Date();
  const { snapshot, unavailable } = await loadPayPalSnapshot(asOf);

  return (
    <StudioDashboard
      data={buildStudioData(buildAnalyticsTables(snapshot, asOf))}
      // Front-end licence keys ship to the browser by design; AG_STUDIO stays out of NEXT_PUBLIC_ so
      // only this page exposes it.
      licenseKey={process.env.AG_STUDIO}
      unavailable={unavailable.map((source) => source.source)}
    />
  );
}
