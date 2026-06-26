"use client";

import Link from "next/link";
import Image from "next/image";
import { BedDouble, Heart, Maximize2, MapPin } from "lucide-react";
import { isCurrentlyFeatured } from "@/services/listings";
import { SELLER_TYPE_LABELS } from "@/types/listing";
import type { PublicListing } from "@/types/listing";

function money(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "XOF", maximumFractionDigits: 0
  }).format(v || 0);
}

export function ListingCard({
  listing,
  liked,
  onLike
}: {
  listing: PublicListing;
  liked: boolean;
  onLike: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Photo carrée */}
      <div className="relative w-full overflow-hidden bg-sobaya-soft" style={{ aspectRatio: "1/1" }}>
        {listing.photoGallery[0] ? (
          <Image
            src={listing.photoGallery[0].url}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            fill
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-sobaya-soft">
            <span className="text-3xl">🏠</span>
          </div>
        )}

        {/* Bouton like */}
        <button
          onClick={e => onLike(listing.id, e)}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:scale-110"
          aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={15} className={liked ? "fill-red-500 text-red-500" : "text-sobaya-muted"} />
        </button>

        {/* Badge annonceur */}
        {listing.sellerType && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-sobaya-ink shadow-sm backdrop-blur-sm">
            {SELLER_TYPE_LABELS[listing.sellerType]}
          </span>
        )}

        {/* Badge vedette */}
        {isCurrentlyFeatured(listing) && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
            ⭐ En vedette
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="p-3.5">
        <p className="text-sm font-semibold text-sobaya-ink line-clamp-1">{listing.title}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-sobaya-muted">
          <MapPin size={10} className="shrink-0 text-sobaya-primary/70" />
          {listing.commune ? `${listing.commune}, ` : ""}{listing.city}
        </p>

        {(listing.rooms || listing.surfaceArea) && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-sobaya-muted">
            {listing.rooms && (
              <span className="flex items-center gap-1">
                <BedDouble size={11} />
                {listing.rooms} p.
              </span>
            )}
            {listing.surfaceArea && (
              <span className="flex items-center gap-1">
                <Maximize2 size={11} />
                {listing.surfaceArea} m²
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-sobaya-border pt-3">
          <div>
            <p className="text-sm font-bold text-sobaya-primary">{money(listing.monthlyRent)}</p>
            <p className="text-[10px] text-sobaya-muted">/mois</p>
          </div>
          <span className="rounded-lg bg-sobaya-soft px-2 py-0.5 text-[10px] text-sobaya-muted">
            {listing.isFurnished ? "Meublé" : "Non meublé"}
          </span>
        </div>
      </div>
    </Link>
  );
}
