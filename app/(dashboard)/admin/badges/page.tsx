import { BadgesManager } from "@/components/admin-saas/badges-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canManageBadges"><BadgesManager /></SuperAdminGate>;
}
