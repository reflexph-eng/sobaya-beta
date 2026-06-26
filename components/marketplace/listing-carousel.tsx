"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { PublicListing } from "@/types/listing";
import type { DemoListing } from "@/constants/demo-listings";
import { ListingCard } from "@/components/marketplace/listing-card";
import { DemoListingCard } from "@/components/marketplace/demo-listing-card";

const CARD_WIDTH = 220; // px — largeur approximative d'une carte
const SCROLL_AMOUNT = CARD_WIDTH * 3; // scroll de 3 cartes à la fois

interface CarouselProps {
  title: string;
  listings: PublicListing[];
  demoListings?: DemoListing[];
  showViewAll?: boolean;
  liked: Set<string>;
  onLike: (id: string, e: React.MouseEvent) => void;
}

export function ListingCarousel({
  title,
  listings,
  demoListings = [],
  showViewAll = false,
  liked,
  onLike
}: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compléter avec les démos si moins de 4 vraies annonces
  const MIN_REAL = 4;
  const demosNeeded = listings.length < MIN_REAL
    ? demoListings.slice(0, 6 - listings.length)
    : [];

  const totalItems = listings.length + demosNeeded.length;
  if (totalItems === 0) return null;

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "right" ? SCROLL_AMOUNT : -SCROLL_AMOUNT,
      behavior: "smooth"
    });
  }

  return (
    <div className="w-full">
      {/* En-tête ligne */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-sobaya-ink">{title}</h2>
        <div className="flex items-center gap-2">
          {/* Flèches — masquées sur mobile */}
          <button
            onClick={() => scroll("left")}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-sobaya-border bg-white shadow-sm transition hover:border-sobaya-primary hover:text-sobaya-primary sm:flex"
            aria-label="Précédent"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden h-8 w-8 items-center justify-center rounded-full border border-sobaya-border bg-white shadow-sm transition hover:border-sobaya-primary hover:text-sobaya-primary sm:flex"
            aria-label="Suivant"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Carrousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {/* Vraies annonces */}
        {listings.map(l => (
          <div
            key={l.id}
            className="w-[200px] shrink-0 sm:w-[220px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <ListingCard
              listing={l}
              liked={liked.has(l.id)}
              onLike={onLike}
            />
          </div>
        ))}

        {/* Annonces demo de complétion */}
        {demosNeeded.map(d => (
          <div
            key={d.id}
            className="w-[200px] shrink-0 sm:w-[220px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <DemoListingCard listing={d} />
          </div>
        ))}

        {/* Carte "Voir tout" */}
        {showViewAll && (
          <div
            className="w-[200px] shrink-0 sm:w-[220px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <Link
              href="/marketplace"
              className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sobaya-border bg-sobaya-soft text-center transition hover:border-sobaya-primary hover:bg-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <ArrowRight size={20} className="text-sobaya-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sobaya-ink">Voir toutes</p>
                <p className="text-xs text-sobaya-muted">les annonces</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
