import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Badge, BadgeTargetType, BadgeType } from "@/types/badge";
import type { Actor } from "@/services/activity-logs";

function badgesCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "badges");
}

function badgeRef(organizationId: string, badgeId: string) {
  return doc(db, "organizations", organizationId, "badges", badgeId);
}

export async function listBadgesForOrganization(organizationId: string): Promise<Badge[]> {
  const q = query(badgesCollection(organizationId), orderBy("grantedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, organizationId, ...item.data() }) as Badge);
}

export async function listBadgesForTarget(organizationId: string, targetType: BadgeTargetType, targetId: string): Promise<Badge[]> {
  const q = query(
    badgesCollection(organizationId),
    where("targetType", "==", targetType),
    where("targetId", "==", targetId),
    where("isActive", "==", true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => ({ id: item.id, organizationId, ...item.data() }) as Badge);
}

export async function grantBadge(
  organizationId: string,
  values: { type: BadgeType; targetType: BadgeTargetType; targetId: string; targetLabel: string; expiresAt?: string; notes?: string },
  actor?: Actor
) {
  const ref = await addDoc(badgesCollection(organizationId), {
    type: values.type,
    targetType: values.targetType,
    targetId: values.targetId,
    targetLabel: values.targetLabel,
    organizationId,
    expiresAt: values.expiresAt ?? null,
    notes: values.notes?.trim() || null,
    isActive: true,
    grantedBy: actor?.userId ?? null,
    grantedByName: actor?.userName ?? "Super Admin SOBAYA",
    grantedAt: serverTimestamp()
  });
  return ref.id;
}

export async function revokeBadge(organizationId: string, badgeId: string, actor?: Actor) {
  await updateDoc(badgeRef(organizationId, badgeId), {
    isActive: false,
    revokedBy: actor?.userId ?? null,
    revokedAt: serverTimestamp()
  });
}

/** Vérifie si un badge est actuellement actif (isActive + non expiré). */
export function isBadgeActive(badge: Badge): boolean {
  if (!badge.isActive) return false;
  if (badge.expiresAt && new Date(badge.expiresAt) < new Date()) return false;
  return true;
}

/** Retourne les badges actifs d'une entité, groupés par type. */
export function getActiveBadgeTypes(badges: Badge[]): Set<BadgeType> {
  return new Set(badges.filter(isBadgeActive).map((b) => b.type));
}
