import { SupportDiagnosticManager } from "@/components/admin-saas/support-diagnostic-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canAccessAdmin"><SupportDiagnosticManager /></SuperAdminGate>;
}
