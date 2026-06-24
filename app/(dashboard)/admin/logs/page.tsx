import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { ActivityLogsManager } from "@/components/admin/activity-logs-manager";
export default function Page() {
  return (
    <SuperAdminGate require="canAccessAdmin">
      <ActivityLogsManager />
    </SuperAdminGate>
  );
}
