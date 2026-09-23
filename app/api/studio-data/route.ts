import { buildAnalyticsTables, loadPayPalSnapshot } from "@/lib/analytics";
import { buildStudioData } from "@/lib/analytics/studio";

// GET /api/studio-data -> { data, unavailable, generated_at }
// `data` is an AG Studio `AgDataSourcesDefinition`: pass it straight to <AgStudio data={...} />.
export async function GET() {
  const asOf = new Date();
  const { snapshot, unavailable } = await loadPayPalSnapshot(asOf);
  return Response.json({
    data: buildStudioData(buildAnalyticsTables(snapshot, asOf)),
    unavailable,
    generated_at: asOf.toISOString(),
  });
}
