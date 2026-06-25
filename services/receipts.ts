import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import type { Payment } from "@/types/payment";
import type { Organization } from "@/types/organization";

export type PublicReceipt = {
  receiptNumber: string;
  organizationId: string;
  organizationName: string;
  paymentId: string;
  contractId: string;
  contractNumber: string;
  tenantName: string;
  propertyName: string;
  paymentDate: string;
  periodStart?: string;
  periodEnd?: string;
  periodLabel?: string;
  periodMonths?: number;
  expectedAmount?: number;
  remainingBalance?: number;
  overpaidAmount?: number;
  amount: number;
  paymentMethod: string;
  reference: string;
  status: string;
  verificationCode: string;
  issuedAt?: unknown;
  issuedBy?: string | null;
  receiptPdfUrl?: string;
};

/**
 * Résout le nom de l'émetteur à afficher sur la quittance.
 * Ordre de priorité :
 *   1. organization.receiptDisplayName (nom commercial configuré dans Paramètres)
 *   2. organization.name (nom de l'organisation)
 *   3. "Gestionnaire non renseigné" — jamais "SOBAYA"
 */
export function resolveIssuerName(organization: Organization | null | undefined): string {
  if (!organization) return "Gestionnaire non renseigné";
  const name = organization.receiptDisplayName?.trim() || organization.name?.trim();
  return name || "Gestionnaire non renseigné";
}

function paymentRef(organizationId: string, paymentId: string) {
  return doc(db, "organizations", organizationId, "payments", paymentId);
}

function publicReceiptRef(receiptNumber: string) {
  return doc(db, "publicReceipts", receiptNumber);
}

function makeVerificationCode(receiptNumber: string, paymentId: string) {
  const base = `${receiptNumber}-${paymentId}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
  return `SBY-${Math.abs(hash).toString(36).toUpperCase().padStart(6, "0")}`;
}

export function buildReceiptUrl(receiptNumber: string) {
  if (typeof window === "undefined") return `/receipt/${receiptNumber}`;
  return `${window.location.origin}/receipt/${receiptNumber}`;
}

/**
 * Émet ou réemet une quittance.
 * - organizationName est TOUJOURS écrit en Firestore (jamais undefined).
 * - merge: true préserve les autres champs existants mais écrase organizationName.
 */
export async function issueReceipt(
  organizationId: string,
  payment: Payment,
  actor?: Actor,
  organization?: Organization | null
) {
  const verificationCode = payment.verificationCode || makeVerificationCode(payment.receiptNumber, payment.id);
  const issuedAt = payment.receiptIssuedAt ?? serverTimestamp();
  const issuedBy = payment.receiptIssuedBy ?? actor?.userId ?? null;
  const receiptPdfUrl = buildReceiptUrl(payment.receiptNumber);

  // Résolution du nom — toujours une string, jamais undefined ni "SOBAYA"
  const organizationName = resolveIssuerName(organization);

  const publicPayload: PublicReceipt = {
    receiptNumber: payment.receiptNumber,
    organizationId,
    organizationName,          // Toujours écrit, jamais undefined
    paymentId: payment.id,
    contractId: payment.contractId,
    contractNumber: payment.contractNumber,
    tenantName: payment.tenantName,
    propertyName: payment.propertyName,
    paymentDate: payment.paymentDate,
    periodStart: payment.periodStart || payment.paymentDate,
    periodEnd: payment.periodEnd || payment.paymentDate,
    periodLabel: payment.periodLabel || "Période non renseignée",
    periodMonths: payment.periodMonths || 1,
    expectedAmount: Number(payment.expectedAmount) || Number(payment.amount) || 0,
    remainingBalance: Number(payment.remainingBalance) || 0,
    overpaidAmount: Number(payment.overpaidAmount) || 0,
    amount: Number(payment.amount) || 0,
    paymentMethod: payment.paymentMethod,
    reference: payment.reference || "",
    status: payment.status,
    verificationCode,
    issuedAt,
    issuedBy,
    receiptPdfUrl
  };

  const paymentPayload: Partial<Payment> & { updatedAt: unknown } = {
    verificationCode,
    receiptPdfUrl,
    updatedAt: serverTimestamp()
  };

  if (!payment.receiptIssuedAt) paymentPayload.receiptIssuedAt = issuedAt;
  if (!payment.receiptIssuedBy) paymentPayload.receiptIssuedBy = issuedBy;

  const batch = writeBatch(db);
  batch.update(paymentRef(organizationId, payment.id), paymentPayload);
  // merge: true préserve les champs non présents dans le payload (QR code, etc.)
  // mais organizationName étant explicitement fourni, il sera TOUJOURS mis à jour
  batch.set(
    publicReceiptRef(payment.receiptNumber),
    { ...publicPayload, updatedAt: serverTimestamp() },
    { merge: true }
  );
  await batch.commit();

  await createActivityLog(organizationId, {
    action: "RECEIPT_ISSUED",
    entityType: "payment",
    entityId: payment.id,
    entityLabel: payment.receiptNumber,
    details: `${payment.tenantName} · ${payment.propertyName}`,
    ...actor
  });
}

export async function getPublicReceipt(receiptNumber: string): Promise<PublicReceipt | null> {
  const snapshot = await getDoc(publicReceiptRef(receiptNumber));
  if (!snapshot.exists()) return null;
  return snapshot.data() as PublicReceipt;
}
