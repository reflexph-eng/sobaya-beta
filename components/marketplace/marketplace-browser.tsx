"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="mx-auto w-full max-w-screen-xl px-5 pb-16">
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
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-sobaya-border py-20 text-center">
          <Home size={40} className="text-sobaya-muted" />
          <p className="font-medium text-sobaya-ink">Aucune annonce trouvée</p>
          <p className="text-sm text-sobaya-muted max-w-xs">Modifiez vos critères de recherche ou revenez bientôt.</p>
          <button type="button" onClick={() => { setFilters({}); setCityInput(""); handleSearch({}); }} className="text-sm font-medium text-sobaya-primary underline underline-offset-2">
            Voir toutes les annonces
          </button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-sobaya-muted">
            <span className="font-semibold text-sobaya-ink">{listings.length}</span> annonce(s) disponible(s){Object.values(filters).some(Boolean) ? " · filtrées" : ""}
          </p>
          {listings.filter(isCurrentlyFeatured).length > 0 && (
            <div className="mb-8">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600">⭐ Annonces en vedette</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.filter(isCurrentlyFeatured).map((listing) => <ListingCard key={listing.id} listing={listing} featured />)}
              </div>
              <div className="mt-6 border-t border-sobaya-border pt-4">
                <p className="mb-3 text-sm font-semibold text-sobaya-ink">Toutes les annonces</p>
              </div>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.filter((l) => !isCurrentlyFeatured(l)).map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </>
      )}
      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" disabled={loadingMore} onClick={handleLoadMore}>{loadingMore ? "Chargement..." : "Voir plus d'annonces"}</Button>
        </div>
      ) : null}
      <div className="mt-12 rounded-2xl bg-sobaya-primary p-8 text-center text-white">
        <p className="text-xl font-bold">Vous avez un bien à louer ?</p>
        <p className="mt-2 text-white/70">Publiez votre annonce gratuitement sur SOBAYA et touchez des milliers de visiteurs.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-sobaya-primary hover:bg-sobaya-soft transition">Publier gratuitement</Link>
          <Link href="/a-propos" className="rounded-xl border border-white/30 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition">En savoir plus</Link>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing, featured = false }: { listing: PublicListing; featured?: boolean }) {
  const money = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(v || 0);
  return (
    <Link href={`/marketplace/${listing.id}`} className={`group overflow-hidden rounded-2xl border bg-white transition hover:shadow-md ${featured ? "border-amber-200 ring-1 ring-amber-200" : "border-sobaya-border"}`}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sobaya-soft">
        {listing.photoGallery[0] ? (
          <Image src={listing.photoGallery[0].url} alt={listing.title} className="h-full w-full object-cover transition group-hover:scale-105" fill unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-sobaya-muted"><Home size={32} /></div>
        )}
        {listing.sellerType ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-sobaya-ink shadow-sm">{SELLER_TYPE_LABELS[listing.sellerType] ?? "Annonceur"}</span>
        ) : null}
        {isCurrentlyFeatured(listing) ? (
          <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">⭐ En vedette</span>
        ) : null}
      </div>
      <div className="p-4">
        <p className="font-medium text-sobaya-ink line-clamp-1">{listing.title}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-sobaya-muted"><MapPin size={11} className="shrink-0" />{listing.commune ? `${listing.commune}, ` : ""}{listing.city}</p>
        <div className="mt-3 flex items-center justify-between border-t border-sobaya-border pt-3">
          <p className="font-bold text-sobaya-primary">{money(listing.monthlyRent)}<span className="text-xs font-normal text-sobaya-muted"> /mois</span></p>
          <p className="rounded-full bg-sobaya-soft px-2 py-0.5 text-xs text-sobaya-muted">{listing.rooms} pièce(s)</p>
        </div>
      </div>
    </Link>
  );
}
