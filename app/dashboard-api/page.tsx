import type { Metadata } from "next";
import { connection } from "next/server";
import { aiEnabled, aiModels } from "@/lib/ai";
import { getDashboardApiData } from "@/lib/dashboard-api";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = {
  title: "Dashboard (REST API)",
};

export default async function DashboardApiPage() {
  // Live PayPal data: render per request, not at build time.
  await connection();
  const data = await getDashboardApiData();

  // Only the model ids reach the client; the OpenAI key stays on the server (lib/ai.ts).
  return (
    <Dashboard
      data={data}
      licenseKey={process.env.AG_STUDIO}
      aiModels={aiEnabled() ? aiModels() : undefined}
    />
  );
}
