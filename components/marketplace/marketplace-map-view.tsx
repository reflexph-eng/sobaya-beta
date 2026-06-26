"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { List, X } from "lucide-react";
import type { PublicListing } from "@/types/listing";

const MapWithMarkers = dynamic(
  () => import("@/components/marketplace/map-with-markers").then((m) => m.MapWithMarkers),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-sobaya-soft">
        <p className="text-sm text-sobaya-muted">Chargement de la carte...</p>
      </div>
    )
  }
);

export function MarketplaceMapView({ listings }: { listings: PublicListing[] }) {
  const [selected, setSelected] = useState<PublicListing | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const withCoords = listings.filter(l => l.coordinates?.lat && l.coordinates?.lng);
  const center = withCoords.length > 0
    ? { lat: withCoords[0].coordinates!.lat, lng: withCoords[0].coordinates!.lng }
    : { lat: 5.345317, lng: -4.024429 }; // Abidjan par défaut

  return (
    <div className="flex flex-1 flex-col overflow-hidden">

      {/* Barre du haut */}
      <div className="flex items-center justify-between border-b border-sobaya-border px-4 py-2.5">
        <p className="text-xs text-sobaya-muted">
          {withCoords.length} bien(s) géolocalisé(s) sur {listings.length} annonce(s)
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-sobaya-primary hover:underline">
          <List size={16} /> Vue liste
        </Link>
      </div>

      {/* Carte + panneau */}
      <div className="relative flex flex-1 overflow-hidden">

        {/* Carte — pleine largeur sur mobile */}
        <div className="relative flex-1">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <MapWithMarkers
            listings={withCoords}
            center={center}
            onMarkerClick={setSelected}
          />
        </div>

        {/* Panneau détail — drawer bas sur mobile, colonne droite sur desktop */}
        {selected && (
          <>
            {/* Desktop — panneau latéral */}
            <div className="hidden md:flex w-72 shrink-0 flex-col overflow-y-auto border-l border-sobaya-border bg-white">
              <div className="flex items-center justify-between border-b border-sobaya-border p-3">
                <p className="text-xs font-medium text-sobaya-muted">Annonce sélectionnée</p>
                <button onClick={() => setSelected(null)} className="text-sobaya-muted hover:text-sobaya-ink">
                  <X size={16} />
                </button>
              </div>
              <ListingDetail listing={selected} />
            </div>

            {/* Mobile — drawer depuis le bas */}
            <div className="absolute bottom-0 left-0 right-0 z-[1000] md:hidden">
              <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-sobaya-border bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-sobaya-border px-4 py-2.5">
                  <p className="text-xs font-medium text-sobaya-muted">Annonce sélectionnée</p>
                  <button onClick={() => setSelected(null)} className="text-sobaya-muted hover:text-sobaya-ink">
                    <X size={16} />
                  </button>
                </div>
                <ListingDetail listing={selected} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListingDetail({ listing }: { listing: PublicListing }) {
  const money = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="p-4">
      {listing.photoGallery[0] && (
        <div className="relative h-36 w-full overflow-hidden rounded-xl">
          <Image
            src={listing.photoGallery[0].url}
            alt={listing.title}
            className="h-full w-full object-cover"
            fill
            unoptimized
          />
        </div>
      )}
      <p className="mt-3 font-semibold text-sobaya-ink line-clamp-2">{listing.title}</p>
      <p className="mt-1 text-sm text-sobaya-muted">{listing.commune ? `${listing.commune}, ` : ""}{listing.city}</p>
      <p className="mt-2 text-base font-bold text-sobaya-primary">{money(listing.monthlyRent)}<span className="text-xs font-normal text-sobaya-muted"> /mois</span></p>
      <Link
        href={`/marketplace/${listing.id}`}
        className="mt-3 block w-full rounded-xl bg-sobaya-primary py-2.5 text-center text-sm font-semibold text-white transition hover:bg-sobaya-primaryDark"
      >
        Voir l&apos;annonce
      </Link>
    </div>
  );
}
