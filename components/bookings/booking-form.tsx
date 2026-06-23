"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { estimateBookingAmount, nightsBetween } from "@/services/bookings";
import { BOOKING_STATUS_LABELS, RATE_PERIOD_LABELS } from "@/types/booking";
import type { Booking, BookingFormValues, BookingStatus, RatePeriod } from "@/types/booking";
import type { Property } from "@/types/property";
import type { Contract } from "@/types/contract";
import { findActiveContractForProperty } from "@/services/business-rules";

const emptyValues: BookingFormValues = {
  propertyId: "",
  tenantId: "",
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  checkInDate: "",
  checkOutDate: "",
  ratePeriod: "daily",
  totalAmount: 0,
  amountPaid: 0,
  status: "pending",
  notes: ""
};

export function BookingForm({
  booking,
  properties,
  contracts = [],
  loading,
  onCancel,
  onSubmit
}: {
  booking?: Booking | null;
  properties: Property[];
  contracts?: Contract[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: BookingFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<BookingFormValues>(emptyValues);
  const [amountManuallyEdited, setAmountManuallyEdited] = useState(Boolean(booking));

  useEffect(() => {
    if (booking) {
      setValues({
        propertyId: booking.propertyId,
        tenantId: booking.tenantId ?? "",
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        guestEmail: booking.guestEmail ?? "",
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        ratePeriod: booking.ratePeriod,
        totalAmount: Number(booking.totalAmount ?? 0),
        amountPaid: Number(booking.amountPaid ?? 0),
        status: booking.status,
        notes: booking.notes ?? ""
      });
      setAmountManuallyEdited(true);
    } else {
      setValues(emptyValues);
      setAmountManuallyEdited(false);
    }
  }, [booking]);

  function update<K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const selectedProperty = properties.find((property) => property.id === values.propertyId);
  const nights = nightsBetween(values.checkInDate, values.checkOutDate);
  const hasActiveClassicContract = selectedProperty ? Boolean(findActiveContractForProperty(contracts, selectedProperty.id)) : false;

  function handleDateOrPropertyChange(next: Partial<BookingFormValues>) {
    setValues((current) => {
      const merged = { ...current, ...next };
      if (!amountManuallyEdited) {
        const property = properties.find((p) => p.id === merged.propertyId);
        const n = nightsBetween(merged.checkInDate, merged.checkOutDate);
        merged.totalAmount = estimateBookingAmount(property?.furnishedRate, n);
      }
      return merged;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      ...values,
      totalAmount: Number(values.totalAmount) || 0,
      amountPaid: Number(values.amountPaid) || 0
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Bien" required value={values.propertyId} onChange={(value) => handleDateOrPropertyChange({ propertyId: value })}>
          <option value="">Sélectionner un bien</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}{property.exploitationMode !== "furnished_short_term" ? " (longue durée)" : ""}
            </option>
          ))}
        </SelectField>
        <SelectField label="Statut" value={values.status} onChange={(value) => update("status", value as BookingStatus)}>
          {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <FormField label="Nom du client" required>
          <Input placeholder="Ex : Awa Koné" value={values.guestName} onChange={(event) => update("guestName", event.target.value)} required />
        </FormField>
        <FormField label="Téléphone" required>
          <Input placeholder="Ex : 07 00 00 00 00" value={values.guestPhone} onChange={(event) => update("guestPhone", event.target.value)} required />
        </FormField>
        <FormField label="Email" help="Optionnel.">
          <Input type="email" placeholder="client@email.com" value={values.guestEmail} onChange={(event) => update("guestEmail", event.target.value)} />
        </FormField>
        <SelectField label="Type de tarification appliqué" value={values.ratePeriod} onChange={(value) => update("ratePeriod", value as RatePeriod)} help="Indicatif : le montant total reste modifiable librement.">
          {Object.entries(RATE_PERIOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <FormField label="Arrivée" required>
          <Input type="date" value={values.checkInDate} onChange={(event) => handleDateOrPropertyChange({ checkInDate: event.target.value })} required />
        </FormField>
        <FormField label="Départ" required help={nights > 0 ? `${nights} nuit(s)` : undefined}>
          <Input type="date" value={values.checkOutDate} onChange={(event) => handleDateOrPropertyChange({ checkOutDate: event.target.value })} required />
        </FormField>
        <FormField label="Montant total (FCFA)" required help="Pré-calculé depuis le tarif du bien si renseigné. Modifiable librement.">
          <Input type="number" min="0" value={values.totalAmount} onChange={(event) => { setAmountManuallyEdited(true); update("totalAmount", Number(event.target.value)); }} required />
        </FormField>
        <FormField label="Montant déjà perçu (FCFA)" help="Quel que soit le mode (acompte, intégral...), indiquez simplement ce qui a été encaissé à ce jour.">
          <Input type="number" min="0" value={values.amountPaid} onChange={(event) => update("amountPaid", Number(event.target.value))} />
        </FormField>
      </div>

      {hasActiveClassicContract ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Attention</p>
          <p className="mt-1">Ce bien a déjà un contrat de location classique actif. Vérifiez qu&apos;il est bien disponible sur la période choisie avant de confirmer cette réservation.</p>
        </div>
      ) : null}
      {selectedProperty && selectedProperty.exploitationMode !== "furnished_short_term" ? (
        <div className="rounded-2xl border border-sobaya-border bg-sobaya-soft/40 p-4 text-sm text-sobaya-muted">
          <p className="font-medium text-sobaya-ink">Information</p>
          <p className="mt-1">Ce bien n&apos;est pas marqué comme « résidence meublée » dans sa fiche. Vous pouvez tout de même créer la réservation, mais pensez à vérifier que cela correspond bien à votre intention.</p>
        </div>
      ) : null}

      <FormField label="Notes" help="Demandes particulières, informations utiles à l'arrivée, etc.">
        <textarea className="min-h-20 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={values.notes} onChange={(event) => update("notes", event.target.value)} />
      </FormField>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : booking ? "Mettre à jour" : "Créer la réservation"}</Button>
      </div>
    </form>
  );
}
