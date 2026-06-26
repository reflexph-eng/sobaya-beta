"use client";

import { BedDouble, Maximize2, MapPin } from "lucide-react";
import type { DemoListing } from "@/constants/demo-listings";

function money(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "XOF", maximumFractionDigits: 0
  }).format(v);
}

function DemoPlaceholderSVG({ title, color }: { title: string; color: string }) {
  // Prendre les 2 premiers mots du titre pour le placeholder
  const words = title.split(" ").slice(0, 3).join(" ");
  return (
    <svg
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      {/* Fond principal */}
      <rect width="300" height="300" fill={color} />
      {/* Motif géométrique décoratif */}
      <circle cx="280" cy="20" r="80" fill="white" fillOpacity="0.05" />
      <circle cx="20" cy="280" r="60" fill="white" fillOpacity="0.05" />
      <rect x="0" y="240" width="300" height="60" fill="black" fillOpacity="0.15" />
      {/* Icône maison centrée */}
      <g transform="translate(150,115)" fill="white" fillOpacity="0.3">
        <polygon points="0,-45 45,0 40,0 40,40 -40,40 -40,0 -45,0" />
        <rect x="-15" y="10" width="30" height="30" fill="white" fillOpacity="0.3" />
      </g>
      {/* Badge "Bientôt disponible" */}
      <rect x="16" y="16" width="130" height="26" rx="13" fill="white" fillOpacity="0.2" />
      <text x="81" y="33" textAnchor="middle" fill="white" fontSize="11" fontFamily="system-ui" fontWeight="600">
        Bientôt disponible
      </text>
      {/* Titre en bas */}
      <text
        x="150" y="262"
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontFamily="system-ui"
        fontWeight="700"
      >
        {words.length > 22 ? words.slice(0, 22) + "…" : words}
      </text>
    </svg>
  );
}

export function DemoListingCard({ listing }: { listing: DemoListing }) {
  return (
    <div className="group relative block overflow-hidden rounded-2xl bg-white shadow-sm opacity-80 cursor-default select-none">
      {/* Photo SVG */}
      <div className="relative w-full overflow-hidden bg-sobaya-soft" style={{ aspectRatio: "1/1" }}>
        <DemoPlaceholderSVG title={listing.title} color={listing.svgColor} />
      </div>

      {/* Infos */}
      <div className="p-3.5">
        <p className="text-sm font-semibold text-sobaya-ink line-clamp-1">{listing.title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-sobaya-muted">
          <MapPin size={10} className="shrink-0 text-sobaya-primary/70" />
          {listing.commune ? `${listing.commune}, ` : ""}{listing.city}
        </p>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-sobaya-muted">
          <span className="flex items-center gap-1">
            <BedDouble size={11} />
            {listing.rooms} pièce{listing.rooms > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 size={11} />
            {listing.surfaceArea} m²
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-sobaya-border pt-3">
          <div>
            <p className="text-sm font-bold text-sobaya-primary">{money(listing.monthlyRent)}</p>
            <p className="text-[10px] text-sobaya-muted">/mois</p>
          </div>
          <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
            Demo
          </span>
        </div>
      </div>
    </div>
  );
}
