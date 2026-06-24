import { GlobalSearchManager } from "@/components/admin-saas/global-search-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canAccessAdmin"><GlobalSearchManager /></SuperAdminGate>;
}
