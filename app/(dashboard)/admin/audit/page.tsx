import { GlobalAuditManager } from "@/components/admin-saas/global-audit-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canAccessAdmin"><GlobalAuditManager /></SuperAdminGate>;
}
