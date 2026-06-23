import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createActivityLog, type Actor } from "@/services/activity-logs";
import { ensureReference } from "@/services/reference-numbers";
import type { Booking, BookingFormValues, BookingStatus, RatePeriod } from "@/types/booking";
import type { Property } from "@/types/property";

function bookingsCollection(organizationId: string) {
  return collection(db, "organizations", organizationId, "bookings");
}

function bookingRef(organizationId: string, bookingId: string) {
  return doc(db, "organizations", organizationId, "bookings", bookingId);
}

/** Statuts considérés comme occupant réellement le calendrier (à l'inverse de "annulée"). */
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed", "checked_in"];

export function isActiveBooking(booking: Pick<Booking, "status" | "isDeleted">) {
  return ACTIVE_BOOKING_STATUSES.includes(booking.status) && booking.isDeleted !== true;
}

function toDateOnly(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function nightsBetween(checkInDate: string, checkOutDate: string) {
  if (!checkInDate || !checkOutDate) return 0;
  const start = toDateOnly(checkInDate);
  const end = toDateOnly(checkOutDate);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

/** Deux séjours se chevauchent si l'un commence avant la fin de l'autre et finit après son début. */
export function bookingsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return toDateOnly(aStart) < toDateOnly(bEnd) && toDateOnly(bStart) < toDateOnly(aEnd);
}

export function findConflictingBooking(bookings: Booking[], propertyId: string, checkInDate: string, checkOutDate: string, ignoredBookingId?: string) {
  return bookings.find((booking) =>
    booking.propertyId === propertyId &&
    booking.id !== ignoredBookingId &&
    isActiveBooking(booking) &&
    bookingsOverlap(checkInDate, checkOutDate, booking.checkInDate, booking.checkOutDate)
  );
}

/**
 * Calcule un montant suggéré à partir du tarif du bien et du nombre de nuits.
 * Dégressivité simple : on découpe le séjour en blocs mensuels puis hebdomadaires
 * puis journaliers, en utilisant le tarif le plus avantageux disponible à chaque palier.
 * L'utilisateur reste libre de modifier le montant final manuellement.
 */
export function estimateBookingAmount(rate: Property["furnishedRate"] | undefined, nights: number): number {
  if (!rate || nights <= 0) return 0;
  const daily = Number(rate.dailyRate) || 0;
  const weekly = Number(rate.weeklyRate) || daily * 7;
  const monthly = Number(rate.monthlyRate) || daily * 30;

  let remaining = nights;
  let total = 0;

  const months = Math.floor(remaining / 30);
  total += months * monthly;
  remaining -= months * 30;

  const weeks = Math.floor(remaining / 7);
  total += weeks * weekly;
  remaining -= weeks * 7;

  total += remaining * daily;
  total += Number(rate.cleaningFee) || 0;

  return Math.round(total);
}

export async function listBookings(organizationId: string): Promise<Booking[]> {
  const q = query(bookingsCollection(organizationId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((item) => ({ id: item.id, organizationId, ...item.data() }) as Booking)
    .filter((item) => item.isDeleted !== true);
}

function derivePaymentStatus(totalAmount: number, amountPaid: number): Booking["paymentStatus"] {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid >= totalAmount) return "paid";
  return "partial";
}

export async function createBooking(organizationId: string, values: BookingFormValues, property: Pick<Property, "name">, actor?: Actor) {
  const existingBookings = await listBookings(organizationId);
  const conflict = ["pending", "confirmed", "checked_in"].includes(values.status)
    ? findConflictingBooking(existingBookings, values.propertyId, values.checkInDate, values.checkOutDate)
    : undefined;
  if (conflict) {
    throw new Error(`Ce bien est déjà réservé sur cette période (réservation ${conflict.bookingNumber}).`);
  }

  const bookingNumber = await ensureReference(organizationId, "booking", undefined);
  const totalAmount = Number(values.totalAmount) || 0;
  const amountPaid = Number(values.amountPaid) || 0;

  const ref = await addDoc(bookingsCollection(organizationId), {
    ...values,
    bookingNumber,
    propertyName: property.name,
    nightsCount: nightsBetween(values.checkInDate, values.checkOutDate),
    totalAmount,
    amountPaid,
    paymentStatus: derivePaymentStatus(totalAmount, amountPaid),
    organizationId,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: actor?.userId ?? null,
    updatedBy: actor?.userId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "BOOKING_CREATED", entityType: "booking", entityId: ref.id, entityLabel: `${property.name} — ${values.guestName}`, ...actor });
  return ref;
}

export async function updateBooking(organizationId: string, bookingId: string, values: BookingFormValues, property: Pick<Property, "name">, actor?: Actor) {
  const existingBookings = await listBookings(organizationId);
  const conflict = ["pending", "confirmed", "checked_in"].includes(values.status)
    ? findConflictingBooking(existingBookings, values.propertyId, values.checkInDate, values.checkOutDate, bookingId)
    : undefined;
  if (conflict) {
    throw new Error(`Ce bien est déjà réservé sur cette période (réservation ${conflict.bookingNumber}).`);
  }

  const totalAmount = Number(values.totalAmount) || 0;
  const amountPaid = Number(values.amountPaid) || 0;

  await updateDoc(bookingRef(organizationId, bookingId), {
    ...values,
    propertyName: property.name,
    nightsCount: nightsBetween(values.checkInDate, values.checkOutDate),
    totalAmount,
    amountPaid,
    paymentStatus: derivePaymentStatus(totalAmount, amountPaid),
    updatedBy: actor?.userId ?? null,
    updatedAt: serverTimestamp()
  });
  await createActivityLog(organizationId, { action: "BOOKING_UPDATED", entityType: "booking", entityId: bookingId, entityLabel: `${property.name} — ${values.guestName}`, ...actor });
}

export async function updateBookingStatus(organizationId: string, booking: Pick<Booking, "id" | "guestName" | "propertyName">, status: BookingStatus, actor?: Actor) {
  await updateDoc(bookingRef(organizationId, booking.id), { status, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "BOOKING_UPDATED", entityType: "booking", entityId: booking.id, entityLabel: `${booking.propertyName} — ${booking.guestName}`, details: `Statut mis à jour : ${status}`, ...actor });
}

/**
 * Sprint 11.2 — soumission d'une demande de réservation depuis la marketplace
 * publique, par un visiteur non authentifié. Volontairement distincte de
 * `createBooking` : cette dernière exige `listBookings` au préalable (pour
 * vérifier les conflits), ce qui nécessite la permission `bookings.read` —
 * inaccessible à un visiteur anonyme par design (un visiteur ne doit jamais
 * pouvoir lire les réservations des autres clients d'une organisation).
 *
 * Conséquence assumée : aucune vérification de conflit n'est faite côté
 * visiteur. La demande est créée avec le statut "pending" uniquement ; c'est
 * à l'organisation de vérifier la disponibilité réelle en back-office avant
 * de confirmer — cohérent avec la décision de ne jamais bloquer directement
 * des dates depuis une demande non authentifiée.
 *
 * Le numéro de réservation n'est pas séquentiel comme pour les réservations
 * back-office (générer un numéro séquentiel nécessiterait de lire la
 * collection, bloqué pour la même raison de sécurité) : un suffixe unique
 * est utilisé à la place. L'organisation peut le renuméroter normalement
 * si elle confirme la demande depuis le back-office.
 */
export async function submitPublicBookingRequest(
  organizationId: string,
  values: {
    propertyId: string;
    propertyName: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    checkInDate: string;
    checkOutDate: string;
    ratePeriod: RatePeriod;
    totalAmount: number;
    notes?: string;
  }
) {
  const bookingNumber = `SBY-RES-WEB-${Date.now().toString(36).toUpperCase()}`;
  const ref = await addDoc(bookingsCollection(organizationId), {
    bookingNumber,
    organizationId,
    propertyId: values.propertyId,
    propertyName: values.propertyName,
    guestName: values.guestName,
    guestPhone: values.guestPhone,
    guestEmail: values.guestEmail ?? null,
    checkInDate: values.checkInDate,
    checkOutDate: values.checkOutDate,
    ratePeriod: values.ratePeriod,
    nightsCount: nightsBetween(values.checkInDate, values.checkOutDate),
    totalAmount: Number(values.totalAmount) || 0,
    amountPaid: 0,
    paymentStatus: "unpaid",
    status: "pending",
    source: "marketplace",
    notes: values.notes ?? null,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdBy: null,
    updatedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

export async function archiveBooking(organizationId: string, booking: Pick<Booking, "id" | "guestName" | "propertyName">, actor?: Actor) {
  await updateDoc(bookingRef(organizationId, booking.id), { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actor?.userId ?? null, updatedBy: actor?.userId ?? null, updatedAt: serverTimestamp() });
  await createActivityLog(organizationId, { action: "BOOKING_ARCHIVED", entityType: "booking", entityId: booking.id, entityLabel: `${booking.propertyName} — ${booking.guestName}`, ...actor });
}
