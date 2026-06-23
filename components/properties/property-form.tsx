"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PropertyPhotoGallery } from "@/components/properties/property-photo-gallery";
import { GpsPicker } from "@/components/properties/gps-picker";
import type { Property, PropertyAvailabilityStatus, PropertyExploitationMode, PropertyFormValues, PropertyOperationalStatus, PropertyType } from "@/types/property";
import { PROPERTY_AMENITIES } from "@/types/property";
import type { OwnerMandate } from "@/types/owner-mandate";

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "studio", label: "Studio" },
  { value: "office", label: "Bureau" },
  { value: "store", label: "Commerce" },
  { value: "land", label: "Terrain" },
  { value: "other", label: "Autre" }
];

const exploitationModes: { value: PropertyExploitationMode; label: string }[] = [
  { value: "long_term", label: "Location longue durée (classique)" },
  { value: "furnished_short_term", label: "Résidence meublée — courte/moyenne durée" }
];

const availabilityOptions: { value: PropertyAvailabilityStatus; label: string }[] = [
  { value: "available", label: "Mis en location / disponible au marché" },
  { value: "withdrawn", label: "Retiré du marché / non proposé" }
];

const operationalOptions: { value: PropertyOperationalStatus; label: string }[] = [
  { value: "normal", label: "Normal / exploitable" },
  { value: "maintenance", label: "Maintenance / travaux" }
];

const emptyValues: PropertyFormValues = {
  name: "",
  reference: "",
  type: "apartment",
  city: "",
  commune: "",
  address: "",
  description: "",
  rooms: 1,
  monthlyRent: 0,
  charges: 0,
  ownerMandateId: "",
  ownerName: "",
  mandateStartDate: "",
  mandateEndDate: "",
  managementFeeType: "percentage",
  managementFeeValue: 0,
  status: "available",
  availabilityStatus: "available",
  operationalStatus: "normal",
  exploitationMode: "long_term",
  isFurnished: false,
  surfaceArea: 0,
  amenities: [],
  coordinates: undefined,
  furnishedRate: undefined
};

export function PropertyForm({
  property,
  owners = [],
  loading,
  organizationId,
  actor,
  onCancel,
  onSubmit
}: {
  property?: Property | null;
  owners?: OwnerMandate[];
  loading?: boolean;
  organizationId?: string;
  actor?: { userId?: string; userName?: string };
  onCancel: () => void;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<PropertyFormValues>(emptyValues);
  const [photoGallery, setPhotoGallery] = useState(property?.photoGallery ?? []);

  useEffect(() => {
    setPhotoGallery(property?.photoGallery ?? []);
    if (property) {
      setValues({
        name: property.name ?? "",
        reference: property.reference ?? "",
        type: property.type ?? "apartment",
        city: property.city ?? "",
        commune: property.commune ?? "",
        address: property.address ?? "",
        description: property.description ?? "",
        rooms: Number(property.rooms ?? 1),
        monthlyRent: Number(property.monthlyRent ?? 0),
        charges: Number(property.charges ?? 0),
        ownerMandateId: property.ownerMandateId ?? "",
        ownerName: property.ownerName ?? "",
        mandateStartDate: property.mandateStartDate ?? "",
        mandateEndDate: property.mandateEndDate ?? "",
        managementFeeType: property.managementFeeType ?? "percentage",
        managementFeeValue: Number(property.managementFeeValue ?? 0),
        status: property.status ?? "available",
        availabilityStatus: property.availabilityStatus ?? (property.status === "archived" ? "withdrawn" : "available"),
        operationalStatus: property.operationalStatus ?? (property.status === "maintenance" ? "maintenance" : "normal"),
        exploitationMode: property.exploitationMode ?? "long_term",
        isFurnished: property.isFurnished ?? false,
        surfaceArea: Number(property.surfaceArea ?? 0),
        amenities: property.amenities ?? [],
        coordinates: property.coordinates ?? undefined,
        furnishedRate: property.furnishedRate ?? undefined
      });
    } else {
      setValues(emptyValues);
    }
  }, [property]);

  function update<K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleAmenity(amenity: string) {
    setValues((current) => {
      const has = current.amenities.includes(amenity);
      return { ...current, amenities: has ? current.amenities.filter((a) => a !== amenity) : [...current.amenities, amenity] };
    });
  }

  function updateCoordinate(axis: "lat" | "lng", raw: string) {
    const numeric = raw === "" ? undefined : Number(raw);
    setValues((current) => ({
      ...current,
      coordinates: { ...(current.coordinates ?? {}), [axis]: numeric } as PropertyFormValues["coordinates"]
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasCompleteCoordinates = values.coordinates?.lat !== undefined && values.coordinates?.lng !== undefined;
    await onSubmit({
      ...values,
      ownerName: owners.find((owner) => owner.id === values.ownerMandateId)?.fullName ?? values.ownerName ?? "",
      rooms: Number(values.rooms),
      monthlyRent: Number(values.monthlyRent),
      charges: Number(values.charges),
      managementFeeValue: Number(values.managementFeeValue || 0),
      surfaceArea: Number(values.surfaceArea || 0),
      coordinates: hasCompleteCoordinates ? { lat: values.coordinates!.lat, lng: values.coordinates!.lng } : undefined
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-sobaya-border bg-sobaya-soft/40 p-4 text-sm text-sobaya-muted">
        <p className="font-medium text-sobaya-ink">Règle métier SOBAYA</p>
        <p className="mt-1">L’occupation n’est plus saisie manuellement : un bien devient occupé uniquement lorsqu’un contrat actif est rattaché à un locataire. Ici, vous définissez seulement s’il est proposé à la location et s’il est exploitable.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Nom du bien" required help="Nom commercial ou nom d'usage du logement.">
          <Input placeholder="Ex : Résidence Les Palmiers" value={values.name} onChange={(event) => update("name", event.target.value)} required />
        </FormField>
        <FormField label="Référence interne" help="Générée automatiquement à la création. Vous pouvez la personnaliser uniquement en modification.">
          <Input placeholder={property ? "Ex : SBY-BIEN-0001" : "Automatique : SBY-BIEN-0001"} value={values.reference} onChange={(event) => update("reference", event.target.value)} disabled={!property} />
        </FormField>

        <SelectField label="Propriétaire mandant" value={values.ownerMandateId ?? ""} onChange={(value) => { const owner = owners.find((item) => item.id === value); setValues((current) => ({ ...current, ownerMandateId: value, ownerName: owner?.fullName ?? "" })); }} help="Optionnel pour un particulier, indispensable pour agent/agence qui gère des biens confiés.">
          <option value="">Aucun / bien propre</option>
          {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.ownerNumber ? `${owner.ownerNumber} — ` : ""}{owner.fullName}</option>)}
        </SelectField>
        <SelectField label="Commission de gestion" value={values.managementFeeType ?? "percentage"} onChange={(value) => update("managementFeeType", value as any)} help="Permet de calculer le montant agence et le net à reverser au propriétaire.">
          <option value="percentage">Pourcentage</option>
          <option value="fixed">Montant fixe</option>
          <option value="none">Aucune commission</option>
        </SelectField>
        <FormField label={values.managementFeeType === "fixed" ? "Commission fixe (FCFA)" : "Commission (%)"}>
          <Input type="number" min="0" value={values.managementFeeValue ?? 0} onChange={(event) => update("managementFeeValue", Number(event.target.value))} />
        </FormField>
        <FormField label="Début du mandat">
          <Input type="date" value={values.mandateStartDate ?? ""} onChange={(event) => update("mandateStartDate", event.target.value)} />
        </FormField>
        <FormField label="Fin du mandat">
          <Input type="date" value={values.mandateEndDate ?? ""} onChange={(event) => update("mandateEndDate", event.target.value)} />
        </FormField>
        <SelectField label="Type de bien" value={values.type} onChange={(value) => update("type", value as PropertyType)}>
          {propertyTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </SelectField>
        <SelectField label="Mise en location" value={values.availabilityStatus} onChange={(value) => update("availabilityStatus", value as PropertyAvailabilityStatus)} help="Un bien peut être libre sans être proposé à la location.">
          {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField label="État opérationnel" value={values.operationalStatus} onChange={(value) => update("operationalStatus", value as PropertyOperationalStatus)} help="La maintenance bloque la mise en location jusqu'à résolution.">
          {operationalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <FormField label="Ville" required>
          <Input placeholder="Ex : Abidjan" value={values.city} onChange={(event) => update("city", event.target.value)} required />
        </FormField>
        <FormField label="Commune">
          <Input placeholder="Ex : Cocody" value={values.commune} onChange={(event) => update("commune", event.target.value)} />
        </FormField>
        <FormField label="Adresse complète" help="Quartier, rue, lot, îlot ou repère utile.">
          <Input placeholder="Ex : Riviera Palmeraie, lot 120" value={values.address} onChange={(event) => update("address", event.target.value)} />
        </FormField>
        <FormField label="Nombre de pièces">
          <Input type="number" min="0" placeholder="Ex : 3" value={values.rooms} onChange={(event) => update("rooms", Number(event.target.value))} />
        </FormField>
        <FormField label="Loyer mensuel (FCFA)" required help="Montant du loyer hors charges.">
          <Input type="number" min="0" placeholder="Ex : 250000" value={values.monthlyRent} onChange={(event) => update("monthlyRent", Number(event.target.value))} required />
        </FormField>
        <FormField label="Charges mensuelles (FCFA)" help="Laissez 0 si aucune charge mensuelle n'est prévue.">
          <Input type="number" min="0" placeholder="Ex : 15000" value={values.charges} onChange={(event) => update("charges", Number(event.target.value))} />
        </FormField>
        <FormField label="Surface (m²)" help="Surface habitable approximative.">
          <Input type="number" min="0" placeholder="Ex : 75" value={values.surfaceArea} onChange={(event) => update("surfaceArea", Number(event.target.value))} />
        </FormField>
        <SelectField label="Mode d'exploitation" value={values.exploitationMode} onChange={(value) => update("exploitationMode", value as PropertyExploitationMode)} help="Une résidence meublée pourra recevoir des réservations courte/moyenne durée depuis le module Réservations.">
          {exploitationModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
        </SelectField>
        <label className="flex items-center gap-2 self-end pb-1 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-sobaya-border" checked={values.isFurnished} onChange={(event) => update("isFurnished", event.target.checked)} />
          <span>Bien meublé</span>
        </label>
      </div>

      <FormField label="Localisation GPS" help="Optionnel. Cliquez sur la carte ou recherchez l'adresse pour positionner le bien.">
        <GpsPicker
          value={values.coordinates}
          onChange={(coords) => update("coordinates", coords)}
        />
      </FormField>


      {values.exploitationMode === "furnished_short_term" ? (
        <div className="rounded-2xl border border-sobaya-border p-4">
          <p className="text-sm font-medium text-sobaya-ink">Tarification résidence meublée</p>
          <p className="mt-1 text-xs text-sobaya-muted">Utilisée pour pré-remplir le montant des réservations. Modifiable à tout moment depuis chaque réservation.</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <FormField label="Tarif journalier (FCFA)" required>
              <Input type="number" min="0" placeholder="Ex : 25000" value={values.furnishedRate?.dailyRate ?? 0} onChange={(event) => update("furnishedRate", { ...values.furnishedRate, dailyRate: Number(event.target.value) })} />
            </FormField>
            <FormField label="Tarif hebdomadaire (FCFA)" help="Laissez vide pour utiliser 7 × tarif journalier.">
              <Input type="number" min="0" placeholder="Ex : 150000" value={values.furnishedRate?.weeklyRate ?? ""} onChange={(event) => update("furnishedRate", { ...values.furnishedRate, dailyRate: values.furnishedRate?.dailyRate ?? 0, weeklyRate: event.target.value === "" ? undefined : Number(event.target.value) })} />
            </FormField>
            <FormField label="Tarif mensuel (FCFA)" help="Laissez vide pour utiliser 30 × tarif journalier.">
              <Input type="number" min="0" placeholder="Ex : 500000" value={values.furnishedRate?.monthlyRate ?? ""} onChange={(event) => update("furnishedRate", { ...values.furnishedRate, dailyRate: values.furnishedRate?.dailyRate ?? 0, monthlyRate: event.target.value === "" ? undefined : Number(event.target.value) })} />
            </FormField>
            <FormField label="Frais de ménage (FCFA)" help="Ajouté automatiquement au montant estimé d'une réservation.">
              <Input type="number" min="0" placeholder="Ex : 10000" value={values.furnishedRate?.cleaningFee ?? ""} onChange={(event) => update("furnishedRate", { ...values.furnishedRate, dailyRate: values.furnishedRate?.dailyRate ?? 0, cleaningFee: event.target.value === "" ? undefined : Number(event.target.value) })} />
            </FormField>
            <FormField label="Caution (FCFA)" help="Indicatif, non automatisé pour l'instant.">
              <Input type="number" min="0" placeholder="Ex : 50000" value={values.furnishedRate?.securityDeposit ?? ""} onChange={(event) => update("furnishedRate", { ...values.furnishedRate, dailyRate: values.furnishedRate?.dailyRate ?? 0, securityDeposit: event.target.value === "" ? undefined : Number(event.target.value) })} />
            </FormField>
          </div>
        </div>
      ) : null}

      <FormField label="Description du bien" help="Ajoutez les informations utiles : étage, parking, sécurité, équipements, etc.">
        <textarea className="min-h-28 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" placeholder="Ex : Appartement lumineux avec balcon, parking et gardiennage." value={values.description} onChange={(event) => update("description", event.target.value)} />
      </FormField>

      <div>
        <p className="mb-2 text-sm font-medium text-sobaya-ink">Équipements</p>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_AMENITIES.map((amenity) => {
            const active = values.amenities.includes(amenity.value);
            return (
              <button
                key={amenity.value}
                type="button"
                onClick={() => toggleAmenity(amenity.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-sobaya-primary bg-sobaya-primary text-white" : "border-sobaya-border bg-white text-sobaya-muted hover:bg-sobaya-soft"}`}
              >
                {amenity.label}
              </button>
            );
          })}
        </div>
      </div>

      {property && organizationId ? (
        <PropertyPhotoGallery
          organizationId={organizationId}
          property={{ id: property.id, name: values.name || property.name, photoGallery }}
          canEdit
          actor={actor}
          onChange={setPhotoGallery}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-sobaya-border px-4 py-4 text-sm text-sobaya-muted">
          Les photos pourront être ajoutées une fois le bien créé. Enregistrez d&apos;abord la fiche, puis rouvrez-la pour ajouter jusqu&apos;à 6 photos.
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : property ? "Mettre à jour" : "Ajouter le bien"}</Button>
      </div>
    </form>
  );
}
