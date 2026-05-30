import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/components/dashboard-overview";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata(
  "Dashboard inteligente",
  "KPIs, tendências, alertas e insights preparados para dados reais.",
  "/dashboard",
);

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard inteligente" eyebrow="Analytics">
      <DashboardOverview />
    </AppShell>
  );
}
