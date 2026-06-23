import { AdSpotsManager } from "@/components/admin-saas/ad-spots-manager";
import { FeaturedRequestsManager } from "@/components/admin-saas/featured-requests-manager";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";

export default function Page() {
  return (
    <SuperAdminGate require="canManageAdSpots">
      <AdSpotsManager />
      <FeaturedRequestsManager />
    </SuperAdminGate>
  );
}
