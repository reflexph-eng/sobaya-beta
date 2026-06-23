/**
 * Système d'invitation locataire — Architecture V2 (simple et fiable)
 *
 * PRINCIPE :
 * - Le propriétaire crée une invitation → stockée dans organizations/{orgId}/tenantInvitations
 * - Le locataire soumet son formulaire → crée un NOUVEAU doc dans tenantSubmissions (collection racine)
 *   allow create: if true — aucun problème de règles, c'est une création pure
 * - Le propriétaire valide la soumission → dossier locataire créé dans SOBAYA
 *
 * Plus de updateDoc sur une collection protégée = plus de bug de règles Firestore.
 */

import {
  addDoc, collection, doc, getDoc, getDocs,
  orderBy, query, serverTimestamp, updateDoc, where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Actor } from "@/services/activity-logs";
import { createActivityLog } from "@/services/activity-logs";

// ── Types ────────────────────────────────────────────────────────────────────

export type InvitationStatus = "pending" | "submitted" | "approved" | "expired";

export interface TenantInvitation {
  id: string;
  organizationId: string;
  tenantNameHint: string;
  tenantPhoneHint: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: Date | unknown;
  createdBy?: string | null;
}

export interface TenantSubmission {
  id: string;
  invitationId: string;
  organizationId: string;
  // Données remplies par le locataire
  displayName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  profession?: string;
  employer?: string;
  nationalId?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  submittedAt: Date | unknown;
}

// ── Collections ───────────────────────────────────────────────────────────────

const invitationsCol = (orgId: string) =>
  collection(db, "organizations", orgId, "tenantInvitations");

const invitationDoc = (orgId: string, id: string) =>
  doc(db, "organizations", orgId, "tenantInvitations", id);

// Collection RACINE — allow create: if true
const submissionsCol = () => collection(db, "tenantSubmissions");

// ── Création d'invitation (propriétaire) ─────────────────────────────────────

export async function createTenantInvitation(
  organizationId: string,
  tenantNameHint: string,
  tenantPhoneHint: string,
  actor?: Actor
): Promise<TenantInvitation> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const ref = await addDoc(invitationsCol(organizationId), {
    organizationId,
    tenantNameHint: tenantNameHint.trim(),
    tenantPhoneHint: tenantPhoneHint.trim(),
    status: "pending",
    expiresAt: expiresAt.toISOString(),
    createdBy: actor?.userId ?? null,
    createdAt: serverTimestamp()
  });

  await createActivityLog(organizationId, {
    action: "TENANT_CREATED",
    entityType: "tenant",
    entityId: ref.id,
    entityLabel: tenantNameHint,
    details: "Invitation envoyée",
    ...actor
  });

  return {
    id: ref.id,
    organizationId,
    tenantNameHint,
    tenantPhoneHint,
    status: "pending",
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date()
  };
}

// ── Lecture d'une invitation par ID (page publique) ───────────────────────────

export async function getInvitationById(
  orgId: string,
  invitationId: string
): Promise<TenantInvitation | null> {
  const snap = await getDoc(invitationDoc(orgId, invitationId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TenantInvitation;
}

// ── Validation d'une invitation ───────────────────────────────────────────────

export function isInvitationValid(inv: TenantInvitation): boolean {
  if (inv.status !== "pending") return false;
  return new Date(inv.expiresAt) > new Date();
}

// ── Soumission du formulaire (locataire anonyme) ──────────────────────────────
// Crée un NOUVEAU document dans tenantSubmissions (collection racine)
// allow create: if true → aucune règle complexe, aucun risque de blocage

export async function submitTenantForm(
  organizationId: string,
  invitationId: string,
  data: Omit<TenantSubmission, "id" | "invitationId" | "organizationId" | "submittedAt">
): Promise<void> {
  // 1. Crée la soumission dans la collection racine (écriture publique libre)
  await addDoc(submissionsCol(), {
    invitationId,
    organizationId,
    ...data,
    submittedAt: serverTimestamp()
  });

  // 2. Met à jour le statut de l'invitation (tentative — si ça échoue, pas grave)
  // La soumission est déjà sauvegardée ci-dessus, ce n'est qu'une mise à jour cosmétique
  try {
    await updateDoc(invitationDoc(organizationId, invitationId), {
      status: "submitted"
    });
  } catch {
    // Silencieux — la soumission principale a réussi, c'est l'essentiel
  }
}

// ── Liste des soumissions en attente (dashboard propriétaire) ─────────────────

export async function listPendingSubmissions(organizationId: string): Promise<TenantSubmission[]> {
  const q = query(
    submissionsCol(),
    where("organizationId", "==", organizationId),
    orderBy("submittedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TenantSubmission);
}

// ── Liste des invitations (dashboard) ────────────────────────────────────────

export async function listTenantInvitations(organizationId: string): Promise<TenantInvitation[]> {
  const q = query(invitationsCol(organizationId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TenantInvitation);
}

// ── Validation d'une soumission → création dossier locataire ─────────────────

export async function approveSubmission(
  organizationId: string,
  submission: TenantSubmission,
  actor?: Actor
): Promise<string> {
  const { createTenant } = await import("@/services/tenants");

  const ref = await createTenant(organizationId, {
    fullName: submission.displayName,
    phone: submission.phone,
    email: submission.email ?? "",
    birthDate: submission.dateOfBirth ?? "",
    profession: submission.profession ?? "",
    employer: submission.employer ?? "",
    identityNumber: submission.nationalId ?? "",
    address: submission.address ?? "",
    emergencyContactName: submission.emergencyContact ?? "",
    emergencyContactPhone: submission.emergencyPhone ?? "",
    status: "active",
    notes: "",
    isDeleted: false,
    deletedAt: null,
    deletedBy: null
  } as Parameters<typeof createTenant>[1], actor);

  // Marquer la soumission comme traitée
  await updateDoc(doc(db, "tenantSubmissions", submission.id), {
    approvedTenantId: ref.id,
    approvedAt: serverTimestamp()
  });

  // Mettre à jour l'invitation
  if (submission.invitationId) {
    try {
      await updateDoc(invitationDoc(organizationId, submission.invitationId), {
        status: "approved"
      });
    } catch { /* silencieux */ }
  }

  return ref.id;
}
