import { SaasSettingsManager } from "@/components/admin-saas/saas-settings-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canManageModules"><SaasSettingsManager /></SuperAdminGate>;
}
