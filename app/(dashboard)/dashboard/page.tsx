import { PageHeader } from "@/components/ui/page-header";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DashboardVisualBanners } from "@/components/dashboard/dashboard-visual-banners";

export default function DashboardPage() {
  return (
    <>
      <DashboardVisualBanners />
      <PageHeader title="Tableau de bord propriétaire" description="Vue synthétique du patrimoine : revenus, occupation, impayés, maintenance, trésorerie et rentabilité par bien." />
      <DashboardOverview />
    </>
  );
}
