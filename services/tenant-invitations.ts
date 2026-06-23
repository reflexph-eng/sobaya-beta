import { addDoc, collection, doc, getDocs, getDoc, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
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

/** Génère un token aléatoire sécurisé de 20 caractères */
function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** Crée une invitation à usage unique valide 7 jours */
export async function createTenantInvitation(
  organizationId: string,
  tenantNameHint: string,
  tenantPhoneHint: string,
  actor?: Actor
): Promise<TenantInvitation> {
  const token = generateToken();
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
    id: ref.id,
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

/** Récupère une invitation par son token (côté public — sans orgId) */
export async function getInvitationByToken(organizationId: string, token: string): Promise<TenantInvitation | null> {
  const q = query(invitationsCollection(organizationId), where("token", "==", token));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as TenantInvitation;
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

/** Valide l'invitation et crée le dossier locataire — appelé par le propriétaire */
export async function approveInvitation(
  organizationId: string,
  invitation: TenantInvitation,
  actor?: Actor
): Promise<string> {
  const data = invitation.submittedData!;

  // Importer createTenant dynamiquement pour éviter les dépendances circulaires
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
