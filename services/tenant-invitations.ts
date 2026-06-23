import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { TenantInvitation, TenantInvitationData } from "@/types/tenant-invitation";
import type { Actor } from "@/services/activity-logs";
import { createActivityLog } from "@/services/activity-logs";

function invitationsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "tenantInvitations");
}

function invitationRef(organizationId: string, id: string) {
  return doc(db, "organizations", organizationId, "tenantInvitations", id);
}

/** Génère un token de sécurité (stocké dans le doc, vérifié à l'ouverture) */
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** Crée une invitation à usage unique valide 7 jours.
 *  URL = /invitation/{orgId}/{docId} — lecture directe par ID, pas de requête where.
 */
export async function createTenantInvitation(
  organizationId: string,
  tenantNameHint: string,
  tenantPhoneHint: string,
  actor?: Actor
): Promise<TenantInvitation> {
  const token = generateToken(); // token de sécurité stocké dans le doc
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const ref = await addDoc(invitationsCollection(organizationId), {
    organizationId,
    tenantNameHint: tenantNameHint.trim(),
    tenantPhoneHint: tenantPhoneHint.trim(),
    token,
    status: "pending",
    expiresAt: expiresAt.toISOString(),
    submittedData: null,
    completedAt: null,
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
    id: ref.id, // C'est l'ID du doc — utilisé dans l'URL
    organizationId,
    tenantNameHint,
    tenantPhoneHint,
    token,
    status: "pending",
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date()
  };
}

/** Liste toutes les invitations d'une organisation */
export async function listTenantInvitations(organizationId: string): Promise<TenantInvitation[]> {
  const q = query(invitationsCollection(organizationId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TenantInvitation);
}

/**
 * Récupère une invitation par son ID de document (getDoc direct — pas de where).
 * URL = /invitation/{orgId}/{invitationId}
 * Fonctionne côté serveur ET côté client, pas de règle list nécessaire.
 */
export async function getInvitationById(organizationId: string, invitationId: string): Promise<TenantInvitation | null> {
  const snap = await getDoc(invitationRef(organizationId, invitationId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as TenantInvitation;
}

/** Valide si une invitation est encore utilisable */
export function isInvitationValid(invitation: TenantInvitation): boolean {
  if (invitation.status !== "pending") return false;
  return new Date(invitation.expiresAt) > new Date();
}

/** Soumet les données du formulaire par le locataire (public, sans auth) */
export async function submitTenantInvitation(
  organizationId: string,
  invitationId: string,
  data: TenantInvitationData
): Promise<void> {
  await updateDoc(invitationRef(organizationId, invitationId), {
    submittedData: data,
    status: "completed",
    completedAt: new Date().toISOString()
  });
}

/** Valide l'invitation et crée le dossier locataire */
export async function approveInvitation(
  organizationId: string,
  invitation: TenantInvitation,
  actor?: Actor
): Promise<string> {
  const data = invitation.submittedData!;
  const { createTenant } = await import("@/services/tenants");
  const ref = await createTenant(organizationId, {
    fullName: data.displayName,
    phone: data.phone,
    email: data.email ?? "",
    birthDate: data.dateOfBirth ?? "",
    profession: data.profession ?? "",
    employer: data.employer ?? "",
    identityNumber: data.nationalId ?? "",
    address: data.address ?? "",
    emergencyContactName: data.emergencyContact ?? "",
    emergencyContactPhone: data.emergencyPhone ?? "",
    status: "active",
    notes: "",
    isDeleted: false,
    deletedAt: null,
    deletedBy: null
  } as Parameters<typeof createTenant>[1], actor);

  await updateDoc(invitationRef(organizationId, invitation.id), {
    status: "expired",
    approvedTenantId: ref.id
  });

  return ref.id;
}
