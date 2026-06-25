import Image from "next/image";
import type { AdSpot, AdSpotSlot } from "@/types/ad-spot";
import { AD_SPOT_DIMENSIONS } from "@/types/ad-spot";

export function AdBanner({
  slot,
  spot,
  className,
  showPlaceholder = false
}: {
  slot: AdSpotSlot;
  spot?: AdSpot;
  className?: string;
  /** Afficher le placeholder uniquement en mode admin/dev. Par défaut false (invisible pour les visiteurs). */
  showPlaceholder?: boolean;
}) {
  // Spot actif avec image → afficher la pub
  if (spot?.isActive && spot.imageUrl) {
    return (
      <a
        href={spot.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`relative block overflow-hidden ${className ?? ""}`}
        aria-label={spot.altText}
      >
        <Image
          src={spot.imageUrl}
          alt={spot.altText}
          className="h-full w-full object-cover"
          fill
          unoptimized
        />
      </a>
    );
  }

  // Pas de pub configurée → invisible pour les visiteurs
  if (!showPlaceholder) return null;

  // Mode admin/dev uniquement → placeholder discret
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center ${className ?? ""}`}>
      <p className="text-xs font-medium text-gray-400">Espace publicitaire disponible</p>
      <p className="mt-1 text-[10px] text-gray-300">{AD_SPOT_DIMENSIONS[slot]}</p>
    </div>
  );
}
