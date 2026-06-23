"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { estimateBookingAmount, nightsBetween, submitPublicBookingRequest } from "@/services/bookings";
import type { PublicListing } from "@/types/listing";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function BookingRequestForm({ listing }: { listing: PublicListing }) {
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const nights = nightsBetween(checkInDate, checkOutDate);
  const estimatedAmount = estimateBookingAmount(listing.furnishedRate, nights);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkInDate || !checkOutDate || nights <= 0) {
      setError("Choisissez des dates d'arrivée et de départ valides.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError("Indiquez votre nom et votre téléphone.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await submitPublicBookingRequest(listing.organizationId, {
        propertyId: listing.propertyId,
        propertyName: listing.title,
        guestName: name.trim(),
        guestPhone: phone.trim(),
        guestEmail: email.trim() || undefined,
        checkInDate,
        checkOutDate,
        ratePeriod: "daily",
        totalAmount: estimatedAmount,
        notes: notes.trim() || undefined
      });
      setSent(true);
    } catch {
      setError("Échec de l'envoi. Réessayez ou contactez directement par téléphone.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        <span>Votre demande de séjour a été envoyée. L&apos;annonceur va vérifier la disponibilité et vous recontactera pour confirmer.</span>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <p className="flex items-center gap-2 text-sm font-medium text-sobaya-ink"><CalendarCheck size={16} /> Demander ce séjour</p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Arrivée" required>
          <Input type="date" value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} required />
        </FormField>
        <FormField label="Départ" required>
          <Input type="date" value={checkOutDate} onChange={(event) => setCheckOutDate(event.target.value)} required />
        </FormField>
      </div>
      {nights > 0 ? (
        <p className="rounded-lg bg-sobaya-soft px-3 py-2 text-xs text-sobaya-muted">
          {nights} nuit(s) · Montant estimatif {money(estimatedAmount)} — confirmé par l&apos;annonceur à la validation.
        </p>
      ) : null}
      <FormField label="Nom" required>
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
      </FormField>
      <FormField label="Téléphone" required>
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} required />
      </FormField>
      <FormField label="Email" help="Optionnel.">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </FormField>
      <FormField label="Message" help="Nombre de voyageurs, demandes particulières...">
        <textarea className="min-h-16 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </FormField>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={sending}>{sending ? "Envoi..." : "Envoyer la demande de séjour"}</Button>
      <p className="text-center text-[11px] text-sobaya-muted">Cette demande n&apos;engage pas la réservation : l&apos;annonceur confirmera la disponibilité.</p>
    </form>
  );
}
