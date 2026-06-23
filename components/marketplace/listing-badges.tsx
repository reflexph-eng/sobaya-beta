"use client";

import { useEffect, useState } from "react";
import { TrustBadgeList } from "@/components/ui/trust-badge";
import { listBadgesForOrganization } from "@/services/badges";
import { getActiveBadgeTypes } from "@/services/badges";
import type { BadgeType } from "@/types/badge";

export function ListingBadges({ organizationId }: { organizationId: string }) {
  const [types, setTypes] = useState<Set<BadgeType>>(new Set());

  useEffect(() => {
    listBadgesForOrganization(organizationId)
      .then((badges) => setTypes(getActiveBadgeTypes(badges)))
      .catch(() => {});
  }, [organizationId]);

  if (types.size === 0) return null;

  return (
    <div className="mt-2">
      <TrustBadgeList types={types} />
    </div>
  );
}
