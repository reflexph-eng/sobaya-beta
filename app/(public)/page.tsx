import { PublicHeader } from "@/components/layout/public-header";
import { LegalFooter } from "@/components/layout/legal-footer";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { AdBanner } from "@/components/marketplace/ad-banner";
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
    <main className="min-h-screen bg-white">
      <PublicHeader />

      {/* Bannière publicitaire horizontale pleine largeur */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-3">
        <AdBanner slot="banner_top" spot={adSpots.banner_top} className="h-[90px] w-full sm:h-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-5 pb-6 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sobaya-ink sm:text-3xl">Trouvez votre prochain logement</h1>
            <p className="mt-2 text-sobaya-muted">Annonces publiées par des propriétaires et agences en Côte d&apos;Ivoire.</p>
          </div>
          <a
            href="/carte"
            className="hidden shrink-0 items-center gap-2 rounded-xl border border-sobaya-border bg-white px-4 py-2 text-sm font-medium text-sobaya-ink transition hover:bg-sobaya-soft sm:inline-flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
            Vue carte
          </a>
        </div>
      </div>

      {/* Layout 3 colonnes : pub gauche | annonces | pub droite */}
      <div className="mx-auto w-full max-w-6xl px-5 pb-12">
        <div className="flex gap-5">
          {/* Colonne gauche : 2 emplacements pub empilés */}
          <aside className="hidden w-[220px] shrink-0 flex-col gap-4 lg:flex">
            <AdBanner slot="sidebar_left_1" spot={adSpots.sidebar_left_1} className="h-[250px] w-full" />
            <AdBanner slot="sidebar_left_2" spot={adSpots.sidebar_left_2} className="h-[250px] w-full" />
          </aside>

          {/* Zone centrale : annonces */}
          <div className="min-w-0 flex-1">
            <MarketplaceBrowser initialPage={initialPage} />
          </div>

          {/* Colonne droite : 1 emplacement pub haut */}
          <aside className="hidden w-[220px] shrink-0 lg:block">
            <AdBanner slot="sidebar_right" spot={adSpots.sidebar_right} className="h-[500px] w-full" />
          </aside>
        </div>
      </div>

      <LegalFooter />
    </main>
  );
}
