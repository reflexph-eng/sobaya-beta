"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { Property, PropertyFormValues, PropertyStatus, PropertyType } from "@/types/property";

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "studio", label: "Studio" },
  { value: "office", label: "Bureau" },
  { value: "store", label: "Commerce" },
  { value: "land", label: "Terrain" },
  { value: "other", label: "Autre" }
];

const statuses: { value: PropertyStatus; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "occupied", label: "Occupé" },
  { value: "maintenance", label: "En maintenance" },
  { value: "archived", label: "Archivé" }
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
  status: "available"
};

export function PropertyForm({
  property,
  loading,
  onCancel,
  onSubmit
}: {
  property?: Property | null;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<PropertyFormValues>(emptyValues);

  useEffect(() => {
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
        status: property.status ?? "available"
      });
    } else {
      setValues(emptyValues);
    }
  }, [property]);

  function update<K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      ...values,
      rooms: Number(values.rooms),
      monthlyRent: Number(values.monthlyRent),
      charges: Number(values.charges)
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Nom du bien" required help="Nom commercial ou nom d'usage du logement.">
          <Input placeholder="Ex : Résidence Les Palmiers" value={values.name} onChange={(event) => update("name", event.target.value)} required />
        </FormField>
        <FormField label="Référence interne" required help="Code unique pour retrouver rapidement le bien.">
          <Input placeholder="Ex : SOB-001" value={values.reference} onChange={(event) => update("reference", event.target.value)} required />
        </FormField>
        <SelectField label="Type de bien" value={values.type} onChange={(value) => update("type", value as PropertyType)}>
          {propertyTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </SelectField>
        <SelectField label="Statut du bien" value={values.status} onChange={(value) => update("status", value as PropertyStatus)}>
          {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
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
      </div>
      <FormField label="Description du bien" help="Ajoutez les informations utiles : étage, parking, sécurité, équipements, etc.">
        <textarea className="min-h-28 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" placeholder="Ex : Appartement lumineux avec balcon, parking et gardiennage." value={values.description} onChange={(event) => update("description", event.target.value)} />
      </FormField>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : property ? "Mettre à jour" : "Ajouter le bien"}</Button>
      </div>
    </form>
  );
}
