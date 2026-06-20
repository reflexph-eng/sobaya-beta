"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { Tenant, TenantFormValues, TenantStatus } from "@/types/tenant";

const initialValues: TenantFormValues = {
  fullName: "",
  phone: "",
  email: "",
  birthDate: "",
  profession: "",
  employer: "",
  identityNumber: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  status: "active"
};

export function TenantForm({ tenant, loading, onCancel, onSubmit }: {
  tenant?: Tenant | null;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: TenantFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<TenantFormValues>(tenant ? {
    fullName: tenant.fullName ?? "",
    phone: tenant.phone ?? "",
    email: tenant.email ?? "",
    birthDate: tenant.birthDate ?? "",
    profession: tenant.profession ?? "",
    employer: tenant.employer ?? "",
    identityNumber: tenant.identityNumber ?? "",
    address: tenant.address ?? "",
    emergencyContactName: tenant.emergencyContactName ?? "",
    emergencyContactPhone: tenant.emergencyContactPhone ?? "",
    status: tenant.status ?? "active"
  } : initialValues);

  function update<K extends keyof TenantFormValues>(key: K, value: TenantFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Nom complet" required>
          <Input placeholder="Ex : Kouassi Jean" required value={values.fullName} onChange={(e) => update("fullName", e.target.value)} />
        </FormField>
        <FormField label="Téléphone" required help="Numéro principal pour les rappels, quittances et alertes.">
          <Input placeholder="Ex : 0707070707" required value={values.phone} onChange={(e) => update("phone", e.target.value)} />
        </FormField>
        <FormField label="Email">
          <Input placeholder="Ex : jean@email.com" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
        </FormField>
        <FormField label="Date de naissance">
          <Input type="date" value={values.birthDate} onChange={(e) => update("birthDate", e.target.value)} />
        </FormField>
        <FormField label="Profession">
          <Input placeholder="Ex : Comptable" value={values.profession} onChange={(e) => update("profession", e.target.value)} />
        </FormField>
        <FormField label="Employeur">
          <Input placeholder="Ex : Société ABC" value={values.employer} onChange={(e) => update("employer", e.target.value)} />
        </FormField>
        <FormField label="Pièce d'identité" help="Numéro CNI, passeport, carte consulaire ou tout autre document.">
          <Input placeholder="Ex : CNI CI0123456789" value={values.identityNumber} onChange={(e) => update("identityNumber", e.target.value)} />
        </FormField>
        <SelectField label="Statut du locataire" value={values.status} onChange={(value) => update("status", value as TenantStatus)}>
          <option value="active">Actif</option>
          <option value="notice">Préavis</option>
          <option value="exited">Sorti</option>
          <option value="suspended">Suspendu</option>
        </SelectField>
      </div>
      <FormField label="Adresse actuelle">
        <Input placeholder="Ex : Cocody Angré, 7e tranche" value={values.address} onChange={(e) => update("address", e.target.value)} />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Contact d'urgence">
          <Input placeholder="Ex : Koné Mariam" value={values.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} />
        </FormField>
        <FormField label="Téléphone du contact d'urgence">
          <Input placeholder="Ex : 0505050505" value={values.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
        </FormField>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : tenant ? "Modifier" : "Ajouter"}</Button>
      </div>
    </form>
  );
}
