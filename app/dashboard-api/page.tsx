import type { Metadata } from "next";
import { connection } from "next/server";
import { getDashboardApiData } from "@/lib/dashboard-api";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = {
  title: "Dashboard (REST API)",
};

export default async function DashboardApiPage() {
  // Live PayPal data: render per request, not at build time.
  await connection();
  const data = await getDashboardApiData();

  return <Dashboard data={data} licenseKey={process.env.AG_STUDIO} />;
}
