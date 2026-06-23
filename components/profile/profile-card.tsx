"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrustBadgeList } from "@/components/ui/trust-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { getActiveBadgeTypes, listBadgesForOrganization } from "@/services/badges";
import type { BadgeType } from "@/types/badge";

export function ProfileCard() {
  const { profile, organization, member } = useAuth();
  const [badgeTypes, setBadgeTypes] = useState<Set<BadgeType>>(new Set());

  useEffect(() => {
    if (!organization?.id) return;
    listBadgesForOrganization(organization.id)
      .then((badges) => setBadgeTypes(getActiveBadgeTypes(badges)))
      .catch(() => {});
  }, [organization?.id]);

  return (
    <Card className="mt-6 max-w-2xl">
      <div className="space-y-3 text-sm">
        <p><span className="text-sobaya-muted">Nom :</span> {profile?.displayName}</p>
        <p><span className="text-sobaya-muted">Email :</span> {profile?.email}</p>
        <p><span className="text-sobaya-muted">Organisation active :</span> {organization?.name}</p>
        <p><span className="text-sobaya-muted">Rôle :</span> {member?.role}</p>
        {badgeTypes.size > 0 ? (
          <div>
            <span className="text-sobaya-muted">Badges de confiance :</span>
            <div className="mt-2">
              <TrustBadgeList types={badgeTypes} />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
