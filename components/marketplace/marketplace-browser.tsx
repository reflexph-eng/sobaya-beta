"use client";

import { useState, useCallback } from "react";
import { Home, MapPin, Search, Map } from "lucide-react";
import { listPublicListings, isCurrentlyFeatured, type ListingPage } from "@/services/listings";
import { SELLER_TYPE_LABELS } from "@/types/listing";
import type { ListingSearchFilters, PublicListing } from "@/types/listing";
import type { PropertyType } from "@/types/property";
import type { OrganizationType } from "@/types/organization";
import { ListingCarousel } from "@/components/marketplace/listing-carousel";
import { MarketplaceEditorial } from "@/components/marketplace/marketplace-editorial";
import { ABIDJAN_DEMOS, INTERIOR_DEMOS, DEMO_LISTINGS } from "@/constants/demo-listings";
import Link from "next/link";
import { usePlatformSettings, PLATFORM_DEFAULTS } from "@/services/platform-settings";

// ── Constantes ────────────────────────────────────────────────────────────────

const PROPERTY_LABELS: Record<PropertyType, string> = {
  apartment: "Appartement", house: "Maison", studio: "Studio",
  office: "Bureau", store: "Commerce", land: "Terrain", other: "Autre"
};

const PILLS: { value: PropertyType | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "apartment", label: "Appartements" },
  { value: "house", label: "Maisons" },
  { value: "studio", label: "Studios" },
  { value: "office", label: "Bureaux" },
  { value: "store", label: "Commerces" },
];

// ── Hook likes ────────────────────────────────────────────────────────────────
function useLikes() {
  const [liked, setLiked] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const raw = localStorage.getItem("sobaya_likes");
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch { return new Set<string>(); }
  });

  const toggle = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(prev => {
      const next = new Set<string>(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem("sobaya_likes", JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }, []);

  return { liked, toggle };
}

// ── Composant principal ───────────────────────────────────────────────────────
export function MarketplaceBrowser({
  initialPage,
  adSpots
}: {
  initialPage: ListingPage;
  adSpots: Record<string, unknown>;
}) {
  const [allListings, setAllListings] = useState<PublicListing[]>(initialPage.listings);
  const [filters, setFilters] = useState<ListingSearchFilters>({});
  const [cityInput, setCityInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PublicListing[] | null>(null);
  const { settings: ps } = usePlatformSettings();
  const { liked, toggle } = useLikes();

  async function handleSearch(nextFilters: ListingSearchFilters, city?: string) {
    const f = { ...nextFilters, city: (city ?? cityInput).trim() || undefined };
    setSearching(true);
    try {
      const page = await listPublicListings(f);
      setFilters(f);
      setSearchResults(page.listings);
    } finally { setSearching(false); }
  }

  function handleReset() {
    setFilters({});
    setCityInput("");
    setSearchResults(null);
  }

  const hasActiveFilters = !!(filters.type || filters.sellerType || filters.furnishedOnly || cityInput || searchResults);

  // ── Lignes de carrousels ──────────────────────────────────────────────────
  const featured = allListings.filter(isCurrentlyFeatured);
  const abidjan = allListings.filter(l => !isCurrentlyFeatured(l) && l.city?.toLowerCase().includes("abidjan"));
  const interior = allListings.filter(l => !isCurrentlyFeatured(l) && !l.city?.toLowerCase().includes("abidjan"));

  return (
    <>
      {/* ── BARRE DE RECHERCHE sticky ──────────────────────────────────── */}
      <div className="sticky top-[73px] z-40 border-b border-sobaya-border bg-white px-5 py-4 shadow-sm">
        <div className="mx-auto w-full max-w-screen-xl">

          <div className="flex h-12 overflow-hidden rounded-2xl border border-sobaya-border bg-white shadow-sm transition-shadow focus-within:border-sobaya-primary focus-within:shadow-md">
            <div className="flex flex-1 items-center gap-2.5 px-4">
              <MapPin size={16} className="shrink-0 text-sobaya-primary" />
              <input
                type="text"
                placeholder="Ville, commune, quartier..."
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch(filters)}
                className="h-full w-full bg-transparent text-sm text-sobaya-ink placeholder:text-sobaya-muted outline-none"
              />
            </div>
            <div className="h-full w-px bg-sobaya-border" />
            <select
              value={filters.sellerType ?? ""}
              onChange={e => setFilters(f => ({ ...f, sellerType: (e.target.value || undefined) as OrganizationType | undefined }))}
              className="h-full cursor-pointer border-none bg-transparent px-4 text-sm text-sobaya-ink outline-none hover:bg-sobaya-soft"
            >
              <option value="">Tous annonceurs</option>
              {Object.entries(SELLER_TYPE_LABELS)
                .filter(([v]) => v !== "enterprise")
                .map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="h-full w-px bg-sobaya-border" />
            <button
              onClick={() => handleSearch(filters)}
              disabled={searching}
              className="flex h-full items-center gap-2 bg-sobaya-primary px-6 text-sm font-semibold text-white transition hover:bg-sobaya-primaryDark disabled:opacity-70"
            >
              <Search size={16} />
              {searching ? "..." : "Rechercher"}
            </button>
            <a
              href="/carte"
              className="flex h-full items-center gap-2 border-l border-sobaya-border px-4 text-sm text-sobaya-muted transition hover:bg-sobaya-soft hover:text-sobaya-ink"
            >
              <Map size={15} />
              Carte
            </a>
          </div>

          {/* Pills filtres — scroll horizontal sur mobile, centré sur desktop */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:justify-center">
            {PILLS.map(pill => (
              <button
                key={pill.value}
                onClick={() => {
                  const next = { ...filters, type: (pill.value || undefined) as PropertyType | undefined };
                  handleSearch(next);
                }}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                  (filters.type ?? "") === pill.value
                    ? "border-sobaya-primary bg-sobaya-primary text-white"
                    : "border-sobaya-border bg-white text-sobaya-muted hover:border-sobaya-primary hover:text-sobaya-primary"
                }`}
              >
                {pill.label}
              </button>
            ))}
            <button
              onClick={() => {
                const next = { ...filters, furnishedOnly: !filters.furnishedOnly };
                handleSearch(next);
              }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                filters.furnishedOnly
                  ? "border-sobaya-primary bg-sobaya-primary text-white"
                  : "border-sobaya-border bg-white text-sobaya-muted hover:border-sobaya-primary hover:text-sobaya-primary"
              }`}
            >
              Meublé
            </button>
            {hasActiveFilters && (
              <button onClick={handleReset} className="ml-1 text-xs text-sobaya-muted underline underline-offset-2 hover:text-sobaya-ink">
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-screen-xl px-5 py-8 space-y-10">

        {/* MODE RECHERCHE — résultats filtrés */}
        {searchResults !== null ? (
          <div>
            <p className="mb-6 text-sm text-sobaya-muted">
              <span className="font-semibold text-sobaya-ink">{searchResults.length}</span>
              {" "}résultat{searchResults.length > 1 ? "s" : ""}
              {cityInput ? ` pour "${cityInput}"` : ""}
              {" "}·{" "}
              <button onClick={handleReset} className="text-sobaya-primary underline underline-offset-2">
                Voir toutes les annonces
              </button>
            </p>

            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-sobaya-border py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sobaya-soft">
                  <Home size={24} className="text-sobaya-muted" />
                </div>
                <p className="font-semibold text-sobaya-ink">Aucune annonce trouvée</p>
                <p className="text-sm text-sobaya-muted max-w-xs">Modifiez vos critères ou revenez bientôt.</p>
                <button onClick={handleReset} className="text-sm font-medium text-sobaya-primary underline underline-offset-2">
                  Voir toutes les annonces
                </button>
              </div>
            ) : (
              <ListingCarousel
                title="Résultats"
                listings={searchResults}
                liked={liked}
                onLike={toggle}
                showViewAll={false}
              />
            )}
          </div>
        ) : (
          /* MODE NORMAL — carrousels thématiques */
          <>
            {/* En vedette */}
            {(featured.length > 0 || DEMO_LISTINGS.length > 0) && (
              <ListingCarousel
                title="⭐ En vedette"
                listings={featured}
                demoListings={DEMO_LISTINGS.slice(0, 6)}
                liked={liked}
                onLike={toggle}
                showViewAll
              />
            )}

            {/* Abidjan */}
            <ListingCarousel
              title="📍 Abidjan"
              listings={abidjan}
              demoListings={ABIDJAN_DEMOS}
              liked={liked}
              onLike={toggle}
              showViewAll
            />

            {/* Intérieur du pays */}
            <ListingCarousel
              title="🗺️ Intérieur du pays"
              listings={interior}
              demoListings={INTERIOR_DEMOS}
              liked={liked}
              onLike={toggle}
              showViewAll
            />
          </>
        )}

        {/* ── CTA PROPRIÉTAIRE ─────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-sobaya-border bg-sobaya-soft">
          <div className="px-6 py-8 sm:px-10 sm:py-10">

            {/* En-tête — icône + titre */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Home size={20} className="text-sobaya-primary" />
              </div>
              <p className="text-lg font-bold text-sobaya-ink leading-snug">
                {ps.ctaTitle || PLATFORM_DEFAULTS.ctaTitle}
              </p>
            </div>

            {/* Sous-titre */}
            <p className="mt-3 text-sm text-sobaya-muted leading-relaxed">
              {ps.ctaSubtitle || PLATFORM_DEFAULTS.ctaSubtitle}
            </p>

            {/* Bullets */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {["Publication gratuite", "Visible immédiatement", "QR Code offert"].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-sobaya-muted">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {t}
                </span>
              ))}
            </div>

            {/* Bouton */}
            <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="rounded-xl bg-sobaya-primary px-7 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-sobaya-primaryDark"
              >
                Publier gratuitement
              </Link>
              <Link
                href="/a-propos"
                className="text-center text-xs text-sobaya-muted underline underline-offset-2 hover:text-sobaya-ink transition sm:text-left"
              >
                En savoir plus sur SOBAYA
              </Link>
            </div>

          </div>
        </div>

      </div>

      <MarketplaceEditorial />
    </>
  );
}
