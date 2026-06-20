import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import { createNotification } from "@/services/notifications";
import type { Contract } from "@/types/contract";
import type { Payment, PaymentFormValues } from "@/types/payment";
import { computePaymentStatus, expectedMonthlyPayment } from "@/services/business-rules";

function paymentsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "payments");
}

function paymentRef(organizationId: string, paymentId: string) {
  return doc(db, "organizations", organizationId, "payments", paymentId);
}

function contractRef(organizationId: string, contractId: string) {
  return doc(db, "organizations", organizationId, "contracts", contractId);
}

function generateReceiptNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REC-${stamp}-${random}`;
}

function computeNextDueDate(current?: string) {
  const base = current ? new Date(current) : new Date();
  if (Number.isNaN(base.getTime())) return new Date().toISOString().slice(0, 10);
  base.setMonth(base.getMonth() + 1);
  return base.toISOString().slice(0, 10);
}

function hydratePaymentPayload(values: PaymentFormValues, contracts: Contract[]) {
  const contract = contracts.find((item) => item.id === values.contractId);
  return {
    contractId: values.contractId,
    contractNumber: contract?.contractNumber ?? "Contrat non renseigné",
    tenantId: contract?.tenantId ?? "",
    tenantName: contract?.tenantName ?? "Locataire non renseigné",
    propertyId: contract?.propertyId ?? "",
    propertyName: contract?.propertyName ?? "Bien non renseigné",
    paymentDate: values.paymentDate,
    amount: Number(values.amount) || 0,
    paymentMethod: values.paymentMethod,
    reference: values.reference ?? "",
    status: computePaymentStatus(Number(values.amount) || 0, expectedMonthlyPayment(contract)),
    notes: values.notes ?? ""
  };
}

async function refreshContractBalance(organizationId: string, contract: Contract | undefined, payments: Payment[]) {
  if (!contract) return;
  const monthlyDue = (Number(contract.monthlyRent) || 0) + (Number(contract.charges) || 0);
  const totalPaid = payments
    .filter((payment) => payment.contractId === contract.id && payment.isDeleted !== true && payment.status !== "cancelled")
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const balance = Math.max(monthlyDue - totalPaid, 0);
  await updateDoc(contractRef(organizationId, contract.id), {
    balance,
    nextDueDate: balance <= 0 ? computeNextDueDate(contract.nextDueDate) : contract.nextDueDate,
    updatedAt: serverTimestamp()
  });
}

export async function listPayments(organizationId: string): Promise<Payment[]> {
  const q = query(paymentsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Payment)
    .filter((item) => item.isDeleted !== true);
}

export async function listArchivedPayments(organizationId: string): Promise<Payment[]> {
  const q = query(paymentsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Payment)
    .filter((item) => item.isDeleted === true);
}

export async function createPayment(organizationId: string, values: PaymentFormValues, contracts: Contract[], actor?: Actor) {
  const payload = hydratePaymentPayload(values, contracts);
  const contract = contracts.find((item) => item.id === values.contractId);
  const receiptNumber = generateReceiptNumber();
  const ref = await addDoc(paymentsCollection(organizationId), {
    ...payload,
    organizationId,
    receiptNumber,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: actor?.userId ?? null,
    updatedBy: actor?.userId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  const payments = await listPayments(organizationId);
  await refreshContractBalance(organizationId, contract, payments);
  await createActivityLog(organizationId, { action: "PAYMENT_CREATED", entityType: "payment", entityId: ref.id, entityLabel: receiptNumber, details: `${payload.tenantName} · ${payload.propertyName}`, ...actor });
  await createNotification(organizationId, { type: payload.status === "partial" ? "payment_partial" : "payment_received", title: payload.status === "partial" ? "Paiement partiel enregistré" : "Paiement reçu", message: `${payload.tenantName} · ${payload.amount.toLocaleString("fr-FR")} FCFA pour ${payload.propertyName}.`, entityType: "payment", entityId: ref.id, entityLabel: receiptNumber, severity: payload.status === "partial" ? "warning" : "success" }, actor);
  return ref;
}

export async function updatePayment(organizationId: string, paymentId: string, values: PaymentFormValues, contracts: Contract[], actor?: Actor) {
  const payload = hydratePaymentPayload(values, contracts);
  const contract = contracts.find((item) => item.id === values.contractId);
  await updateDoc(paymentRef(organizationId, paymentId), { ...payload, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  const payments = await listPayments(organizationId);
  await refreshContractBalance(organizationId, contract, payments);
  await createActivityLog(organizationId, { action: "PAYMENT_UPDATED", entityType: "payment", entityId: paymentId, entityLabel: payload.contractNumber, details: `${payload.tenantName} · ${payload.propertyName}`, ...actor });
}

export async function archivePayment(organizationId: string, payment: Pick<Payment, "id" | "receiptNumber" | "contractId">, contracts: Contract[], actor?: Actor) {
  await updateDoc(paymentRef(organizationId, payment.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  const payments = await listPayments(organizationId);
  const contract = contracts.find((item) => item.id === payment.contractId);
  await refreshContractBalance(organizationId, contract, payments);
  await createActivityLog(organizationId, { action: "PAYMENT_ARCHIVED", entityType: "payment", entityId: payment.id, entityLabel: payment.receiptNumber, ...actor });
}

export async function restorePayment(organizationId: string, payment: Pick<Payment, "id" | "receiptNumber" | "contractId">, contracts: Contract[], actor?: Actor) {
  await updateDoc(paymentRef(organizationId, payment.id), { isDeleted: false, deletedAt: null, deletedBy: null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  const payments = await listPayments(organizationId);
  const contract = contracts.find((item) => item.id === payment.contractId);
  await refreshContractBalance(organizationId, contract, payments);
  await createActivityLog(organizationId, { action: "PAYMENT_RESTORED", entityType: "payment", entityId: payment.id, entityLabel: payment.receiptNumber, ...actor });
}
