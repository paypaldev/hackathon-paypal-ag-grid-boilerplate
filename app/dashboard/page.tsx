import type { Metadata } from "next";
import { connection } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { StudioDashboard } from "./studio-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  await connection();
  const data = await getDashboardData();

  return <StudioDashboard data={data} licenseKey={process.env.AG_STUDIO} />;
}
