import type { AdSpot, AdSpotSlot } from "@/types/ad-spot";
import { AD_SPOT_DIMENSIONS } from "@/types/ad-spot";

export function AdBanner({
  slot,
  spot,
  className
}: {
  slot: AdSpotSlot;
  spot?: AdSpot;
  className?: string;
}) {
  if (spot?.isActive && spot.imageUrl) {
    return (
      <a
        href={spot.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={className}
        aria-label={spot.altText}
      >
        <img
          src={spot.imageUrl}
          alt={spot.altText}
          className="h-full w-full object-cover"
        />
      </a>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center ${className ?? ""}`}>
      <p className="text-xs font-medium text-gray-400">Espace publicitaire disponible</p>
      <p className="mt-1 text-[10px] text-gray-300">{AD_SPOT_DIMENSIONS[slot]}</p>
    </div>
  );
}
