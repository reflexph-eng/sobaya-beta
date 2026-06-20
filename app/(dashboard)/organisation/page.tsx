import { PageHeader } from "@/components/ui/page-header";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";

export default function OrganisationPage() {
  return (
    <>
      <PageHeader title="Organisation" description="Paramètres de base de votre espace SOBAYA." />
      <OrganizationSettingsForm />
    </>
  );
}
