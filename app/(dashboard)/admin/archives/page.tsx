import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { ArchivesManager } from "@/components/admin/archives-manager";
export default function Page() {
  return (
    <SuperAdminGate require="canAccessAdmin">
      <ArchivesManager />
    </SuperAdminGate>
  );
}
