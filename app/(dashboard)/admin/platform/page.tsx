import { PlatformStatsManager } from "@/components/admin-saas/platform-stats-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canAccessAdmin"><PlatformStatsManager /></SuperAdminGate>;
}
