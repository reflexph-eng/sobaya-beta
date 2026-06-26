import { PublicHeader } from "@/components/layout/public-header";
import { LegalFooter } from "@/components/layout/legal-footer";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { listPublicListings } from "@/services/listings";
import { getAdSpotsMap } from "@/services/ad-spots";
import { serializeFirestoreData } from "@/lib/serialize-firestore";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [initialPage, adSpots] = await Promise.all([
    listPublicListings().then(serializeFirestoreData),
    getAdSpotsMap().then(serializeFirestoreData)
  ]);

  return (
    <div className="min-h-screen bg-white">

      {/* HEADER sticky */}
      <div className="sticky top-0 z-50 border-b border-sobaya-border bg-white">
        <PublicHeader />
      </div>

      {/* BARRE DE RECHERCHE sticky sous le header */}
      <MarketplaceBrowser initialPage={initialPage} adSpots={adSpots} />

      <LegalFooter />
    </div>
  );
}
