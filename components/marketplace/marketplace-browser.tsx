"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { listPublicListings, isCurrentlyFeatured, type ListingPage } from "@/services/listings";
import { SELLER_TYPE_LABELS } from "@/types/listing";
import type { ListingSearchFilters, PublicListing } from "@/types/listing";
import type { PropertyType } from "@/types/property";
import type { OrganizationType } from "@/types/organization";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "Appartement",
  house: "Maison",
  studio: "Studio",
  office: "Bureau",
  store: "Commerce",
  land: "Terrain",
  other: "Autre"
};

export function MarketplaceBrowser({ initialPage }: { initialPage: ListingPage }) {
  const [listings, setListings] = useState<PublicListing[]>(initialPage.listings);
  const [cursor, setCursor] = useState(initialPage.cursor);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<ListingSearchFilters>({});
  const [cityInput, setCityInput] = useState("");
  const [searching, setSearching] = useState(false);

  async function handleSearch(nextFilters: ListingSearchFilters) {
    setSearching(true);
    try {
      const page = await listPublicListings(nextFilters);
      setListings(page.listings);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      setFilters(nextFilters);
    } finally {
      setSearching(false);
    }
  }

  async function handleLoadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const page = await listPublicListings(filters, cursor);
      setListings((current) => [...current, ...page.listings]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16">
      <div className="mb-6 space-y-3 rounded-2xl border border-sobaya-border p-4">
        {/* Ligne 1 : Recherche par ville + bouton */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sobaya-muted" />
            <Input placeholder="Rechercher par ville (ex : Abidjan, Cocody...)" value={cityInput} onChange={(event) => setCityInput(event.target.value)} className="pl-9" />
          </div>
          <Button disabled={searching} onClick={() => handleSearch({ ...filters, city: cityInput.trim() || undefined })}>
            <Search size={16} /> {searching ? "Recherche..." : "Rechercher"}
          </Button>
        </div>
        {/* Ligne 2 : Filtres affinés */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-sobaya-muted">Filtrer par :</span>
          <select
            value={filters.type ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, type: (event.target.value || undefined) as PropertyType | undefined }))}
            className="h-9 rounded-xl border border-sobaya-border bg-white px-3 text-sm text-sobaya-ink outline-none focus:border-sobaya-primary"
          >
            <option value="">Tous types de bien</option>
            {Object.entries(propertyTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select
            value={filters.sellerType ?? ""}
            onChange={(event) => setFilters((current) => ({ ...current, sellerType: (event.target.value || undefined) as OrganizationType | undefined }))}
            className="h-9 rounded-xl border border-sobaya-border bg-white px-3 text-sm text-sobaya-ink outline-none focus:border-sobaya-primary"
          >
            <option value="">Tous annonceurs</option>
            {Object.entries(SELLER_TYPE_LABELS).filter(([value]) => value !== "enterprise").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-sobaya-muted cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-sobaya-border accent-sobaya-primary" checked={Boolean(filters.furnishedOnly)} onChange={(event) => setFilters((current) => ({ ...current, furnishedOnly: event.target.checked }))} />
            Meublé uniquement
          </label>
          {(filters.type || filters.sellerType || filters.furnishedOnly) ? (
            <button
              type="button"
              onClick={() => setFilters({})}
              className="text-xs text-sobaya-muted underline underline-offset-2 hover:text-sobaya-ink"
            >
              Effacer les filtres
            </button>
          ) : null}
        </div>
      </div>

      {listings.length === 0 ? (
        <EmptyState icon={<Home size={34} />} title="Aucune annonce trouvée" description="Modifiez vos critères de recherche ou revenez plus tard." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/marketplace/${listing.id}`} className="group overflow-hidden rounded-2xl border border-sobaya-border bg-white transition hover:shadow-soft">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-sobaya-soft">
                {listing.photoGallery[0] ? (
                  <img src={listing.photoGallery[0].url} alt={listing.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sobaya-muted"><Home size={32} /></div>
                )}
                {listing.sellerType ? (
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-sobaya-ink shadow-sm">
                    {SELLER_TYPE_LABELS[listing.sellerType] ?? "Annonceur"}
                  </span>
                ) : null}
                {isCurrentlyFeatured(listing) ? (
                  <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                    ⭐ En vedette
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <p className="font-medium text-sobaya-ink">{listing.title}</p>
                <p className="mt-1 text-sm text-sobaya-muted">{listing.commune ? `${listing.commune}, ` : ""}{listing.city}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-semibold text-sobaya-primary">{money(listing.monthlyRent)}<span className="text-xs font-normal text-sobaya-muted"> /mois</span></p>
                  <p className="text-xs text-sobaya-muted">{listing.rooms} pièce(s)</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" disabled={loadingMore} onClick={handleLoadMore}>{loadingMore ? "Chargement..." : "Voir plus d'annonces"}</Button>
        </div>
      ) : null}
    </div>
  );
}
