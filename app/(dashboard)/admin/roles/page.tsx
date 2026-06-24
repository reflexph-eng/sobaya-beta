import { GlobalRolesManager } from "@/components/admin-saas/global-roles-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canManageGlobalRoles"><GlobalRolesManager /></SuperAdminGate>;
}
