"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { List } from "lucide-react";
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

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function MarketplaceMapView({ listings }: { listings: PublicListing[] }) {
  const withCoords = listings.filter((l) => l.coordinates?.lat && l.coordinates?.lng);
  const [selected, setSelected] = useState<PublicListing | null>(null);

  // Centre par défaut sur Abidjan
  const center = withCoords.length > 0
    ? { lat: withCoords[0].coordinates!.lat, lng: withCoords[0].coordinates!.lng }
    : { lat: 5.3599517, lng: -4.0082563 };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sobaya-border bg-white px-5 py-3">
        <p className="text-sm font-medium text-sobaya-ink">
          {withCoords.length} bien(s) géolocalisé(s) sur {listings.length} annonce(s)
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-sobaya-primary hover:underline">
          <List size={16} /> Vue liste
        </Link>
      </div>

      {/* Carte + panneau latéral */}
      <div className="flex flex-1 overflow-hidden">
        {/* Carte */}
        <div className="relative flex-1">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <MapWithMarkers
            listings={withCoords}
            center={center}
            onMarkerClick={setSelected}
          />
        </div>

        {/* Panneau de détail au clic */}
        {selected ? (
          <div className="w-72 shrink-0 overflow-y-auto border-l border-sobaya-border bg-white p-4">
            {selected.photoGallery[0] ? (
              <Image src={selected.photoGallery[0].url} alt={selected.title} className="h-40 w-full rounded-xl object-cover" fill unoptimized />
            ) : null}
            <p className="mt-3 font-medium text-sobaya-ink">{selected.title}</p>
            <p className="mt-1 text-sm text-sobaya-muted">{selected.commune ? `${selected.commune}, ` : ""}{selected.city}</p>
            <p className="mt-2 font-semibold text-sobaya-primary">{money(selected.monthlyRent)}<span className="text-xs font-normal text-sobaya-muted"> /mois</span></p>
            <Link
              href={`/marketplace/${selected.id}`}
              className="mt-4 block rounded-xl bg-sobaya-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-sobaya-primaryDark"
            >
              Voir l&apos;annonce
            </Link>
            <button type="button" onClick={() => setSelected(null)} className="mt-2 block w-full text-center text-xs text-sobaya-muted hover:text-sobaya-ink">
              Fermer
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
