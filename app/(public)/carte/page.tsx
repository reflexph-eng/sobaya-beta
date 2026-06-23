import { PublicHeader } from "@/components/layout/public-header";
import { MarketplaceMapView } from "@/components/marketplace/marketplace-map-view";
import { listPublicListings } from "@/services/listings";
import { serializeFirestoreData } from "@/lib/serialize-firestore";

export const dynamic = "force-dynamic";

export default async function CartePage() {
  const page = serializeFirestoreData(await listPublicListings({}, null, 200));

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-white">
      <PublicHeader />
      <MarketplaceMapView listings={page.listings} />
    </main>
  );
}
