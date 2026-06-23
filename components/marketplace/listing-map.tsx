"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Import dynamique avec ssr:false — obligatoire pour Leaflet qui utilise
// window/document au chargement, incompatibles avec le rendu serveur Next.js.
const LeafletMapInner = dynamic(
  () => import("@/components/marketplace/leaflet-map-inner").then((module) => module.LeafletMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-sobaya-soft">
        <p className="text-sm text-sobaya-muted">Chargement de la carte...</p>
      </div>
    )
  }
);

export function ListingMap({
  lat,
  lng,
  title,
  address,
  approximate = true
}: {
  lat: number;
  lng: number;
  title: string;
  address?: string;
  /** Affiche un cercle approximatif plutôt que la position exacte (recommandé pour protéger la vie privée). Par défaut: true. */
  approximate?: boolean;
}) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-sobaya-ink">
          <MapPin size={15} className="text-sobaya-primary" />
          Localisation
        </p>
        {approximate ? (
          <span className="text-xs text-sobaya-muted">Zone approximative</span>
        ) : null}
      </div>

      {/* Leaflet nécessite son CSS chargé explicitement */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="h-[280px] w-full overflow-hidden rounded-2xl border border-sobaya-border">
        <LeafletMapInner lat={lat} lng={lng} title={title} approximate={approximate} />
      </div>

      {address ? (
        <p className="mt-2 text-xs text-sobaya-muted">{address}</p>
      ) : null}

      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs font-medium text-sobaya-primary underline underline-offset-2"
      >
        Ouvrir dans Google Maps →
      </a>
    </div>
  );
}
