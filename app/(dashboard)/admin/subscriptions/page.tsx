import { SubscriptionsAdminManager } from "@/components/admin-saas/subscriptions-admin-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return <SuperAdminGate require="canManageSubscriptions"><SubscriptionsAdminManager /></SuperAdminGate>;
}
