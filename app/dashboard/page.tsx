import type { Metadata } from "next";
import { connection } from "next/server";
import { aiEnabled, aiModels } from "@/lib/ai";
import { getDashboardData } from "@/lib/dashboard-data";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  // Live PayPal data: render per request, not at build time.
  await connection();
  const data = await getDashboardData();

  // Only the model ids reach the client; the OpenAI key stays on the server (lib/ai.ts).
  return (
    <Dashboard
      data={data}
      licenseKey={process.env.AG_STUDIO}
      aiModels={aiEnabled() ? aiModels() : undefined}
    />
  );
}
