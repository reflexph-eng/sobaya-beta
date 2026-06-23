import type { BadgeType } from "@/types/badge";
import { BADGE_LABELS } from "@/types/badge";

const BADGE_STYLES: Record<BadgeType, string> = {
  verified_account: "border-emerald-200 bg-emerald-50 text-emerald-700",
  verified_property: "border-emerald-200 bg-emerald-50 text-emerald-700",
  certified_agent: "border-amber-200 bg-amber-50 text-amber-700",
  certified_agency: "border-amber-200 bg-amber-50 text-amber-700",
  inspected_property: "border-blue-200 bg-blue-50 text-blue-700"
};

export function TrustBadge({
  type,
  size = "sm"
}: {
  type: BadgeType;
  size?: "sm" | "md";
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${BADGE_STYLES[type]} ${size === "md" ? "text-sm" : "text-xs"}`}>
      {BADGE_LABELS[type]}
    </span>
  );
}

export function TrustBadgeList({ types }: { types: Set<BadgeType> }) {
  if (types.size === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from(types).map((type) => (
        <TrustBadge key={type} type={type} />
      ))}
    </div>
  );
}
