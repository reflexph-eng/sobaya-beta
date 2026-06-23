/**
 * Sprint Invitation Locataire.
 * Chaque invitation est un document dans organizations/{orgId}/tenantInvitations/{token}
 * Le token est aléatoire, à usage unique, valide 7 jours.
 */
export type InvitationStatus = "pending" | "completed" | "expired";

export interface TenantInvitation {
  id: string;
  organizationId: string;
  /** Nom saisi par le propriétaire au moment de la création de l'invitation */
  tenantNameHint: string;
  /** Téléphone saisi par le propriétaire (pour retrouver l'invitation) */
  tenantPhoneHint: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string; // ISO date
  createdAt: Date | unknown;
  completedAt?: string | null;
  /** Données remplies par le locataire */
  submittedData?: TenantInvitationData | null;
  createdBy?: string | null;
}

export interface TenantInvitationData {
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
}
