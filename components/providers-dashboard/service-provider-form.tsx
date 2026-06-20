"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { ServiceProvider, ServiceProviderFormValues, ServiceProviderSpecialty, ServiceProviderStatus } from "@/types/provider";

export const specialtyLabels: Record<ServiceProviderSpecialty, string> = {
  plomberie: "Plomberie",
  electricite: "Électricité",
  climatisation: "Climatisation",
  peinture: "Peinture",
  serrurerie: "Serrurerie",
  maconnerie: "Maçonnerie",
  menuiserie: "Menuiserie",
  jardinage: "Jardinage",
  nettoyage: "Nettoyage",
  securite: "Sécurité",
  autre: "Autre"
};

export const providerStatusLabels: Record<ServiceProviderStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  archived: "Archivé"
};

const emptyValues: ServiceProviderFormValues = {
  name: "",
  company: "",
  phone: "",
  email: "",
  specialty: "plomberie",
  city: "",
  status: "active",
  notes: ""
};

export function ServiceProviderForm({ provider, loading, onCancel, onSubmit }: { provider?: ServiceProvider | null; loading?: boolean; onCancel: () => void; onSubmit: (values: ServiceProviderFormValues) => Promise<void>; }) {
  const [values, setValues] = useState<ServiceProviderFormValues>(emptyValues);

  useEffect(() => {
    setValues(provider ? {
      name: provider.name ?? "",
      company: provider.company ?? "",
      phone: provider.phone ?? "",
      email: provider.email ?? "",
      specialty: provider.specialty ?? "plomberie",
      city: provider.city ?? "",
      status: provider.status ?? "active",
      notes: provider.notes ?? ""
    } : emptyValues);
  }, [provider]);

  function update<K extends keyof ServiceProviderFormValues>(key: K, value: ServiceProviderFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Nom du prestataire" required>
          <Input value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="Ex : Kouamé Yao" required />
        </FormField>
        <FormField label="Entreprise">
          <Input value={values.company} onChange={(event) => update("company", event.target.value)} placeholder="Ex : Yao Services" />
        </FormField>
        <FormField label="Téléphone" required>
          <Input value={values.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Ex : 0700000000" required />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="contact@email.com" />
        </FormField>
        <SelectField label="Spécialité" value={values.specialty} onChange={(value) => update("specialty", value as ServiceProviderSpecialty)}>
          {Object.entries(specialtyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <FormField label="Ville / commune">
          <Input value={values.city} onChange={(event) => update("city", event.target.value)} placeholder="Ex : Cocody" />
        </FormField>
        <SelectField label="Statut" value={values.status} onChange={(value) => update("status", value as ServiceProviderStatus)}>
          {Object.entries(providerStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
      </div>
      <FormField label="Notes internes">
        <textarea className="min-h-20 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={values.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Disponibilité, qualité, tarifs indicatifs..." />
      </FormField>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading || !values.name || !values.phone}>{loading ? "Enregistrement..." : provider ? "Mettre à jour" : "Créer le prestataire"}</Button>
      </div>
    </form>
  );
}
