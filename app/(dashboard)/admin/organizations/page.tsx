import { OrganizationsAdminManager } from "@/components/admin-saas/organizations-admin-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canManageOrganizations"><OrganizationsAdminManager /></SuperAdminGate>;
}
