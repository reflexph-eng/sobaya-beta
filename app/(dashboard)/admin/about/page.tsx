import { AboutManager } from "@/components/admin-saas/about-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate><AboutManager /></SuperAdminGate>;
}
