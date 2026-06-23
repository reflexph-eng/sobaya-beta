import { PageHeader } from "@/components/ui/page-header";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { DashboardWidgetsSettings } from "@/components/settings/dashboard-widgets-settings";
import { AgenceQrCode } from "@/components/organisation/agence-qr-code";

export default function OrganisationPage() {
  return (
    <>
      <PageHeader title="Organisation" description="Paramètres de base de votre espace SOBAYA." />
      <OrganizationSettingsForm />
      <AgenceQrCode />
      <DashboardWidgetsSettings />
    </>
  );
}
