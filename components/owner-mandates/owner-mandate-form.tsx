"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { OwnerMandate, OwnerMandateFormValues, OwnerMandateType } from "@/types/owner-mandate";

const emptyValues: OwnerMandateFormValues = {
  ownerNumber: "",
  fullName: "",
  type: "individual",
  phone: "",
  email: "",
  address: "",
  notes: "",
  status: "active",
  isDeleted: false,
  deletedAt: null,
  deletedBy: null
};

export function OwnerMandateForm({ owner, loading, onCancel, onSubmit }: { owner?: OwnerMandate | null; loading?: boolean; onCancel: () => void; onSubmit: (values: OwnerMandateFormValues) => Promise<void>; }) {
  const [values, setValues] = useState<OwnerMandateFormValues>(emptyValues);

  useEffect(() => {
    if (owner) {
      setValues({
        ownerNumber: owner.ownerNumber ?? "",
        fullName: owner.fullName ?? "",
        type: owner.type ?? "individual",
        phone: owner.phone ?? "",
        email: owner.email ?? "",
        address: owner.address ?? "",
        notes: owner.notes ?? "",
        status: owner.status ?? "active",
        isDeleted: owner.isDeleted ?? false,
        deletedAt: owner.deletedAt ?? null,
        deletedBy: owner.deletedBy ?? null
      });
    } else {
      setValues(emptyValues);
    }
  }, [owner]);

  function update<K extends keyof OwnerMandateFormValues>(key: K, value: OwnerMandateFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-sobaya-border bg-sobaya-soft/40 p-4 text-sm text-sobaya-muted">
        <p className="font-medium text-sobaya-ink">Propriétaire mandant</p>
        <p className="mt-1">Cette fiche permet à une agence ou un agent de gérer un propriétaire client qui n&apos;a pas forcément de compte SOBAYA.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Référence propriétaire" help="Générée automatiquement à la création.">
          <Input value={values.ownerNumber ?? ""} onChange={(event) => update("ownerNumber", event.target.value)} disabled={!owner} placeholder={owner ? "SBY-PRO-0001" : "Automatique : SBY-PRO-0001"} />
        </FormField>
        <SelectField label="Type" value={values.type} onChange={(value) => update("type", value as OwnerMandateType)}>
          <option value="individual">Particulier</option>
          <option value="company">Société / personne morale</option>
        </SelectField>
        <FormField label="Nom du propriétaire" required>
          <Input value={values.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Ex : M. Kouassi Jean" required />
        </FormField>
        <FormField label="Téléphone" required>
          <Input value={values.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Ex : +225 07 00 00 00 00" required />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={values.email ?? ""} onChange={(event) => update("email", event.target.value)} placeholder="Email optionnel" />
        </FormField>
        <FormField label="Adresse">
          <Input value={values.address ?? ""} onChange={(event) => update("address", event.target.value)} placeholder="Adresse ou repère" />
        </FormField>
      </div>
      <FormField label="Notes internes">
        <textarea className="min-h-24 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={values.notes ?? ""} onChange={(event) => update("notes", event.target.value)} placeholder="Conditions de gestion, préférences, informations utiles." />
      </FormField>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : owner ? "Mettre à jour" : "Ajouter le propriétaire"}</Button>
      </div>
    </form>
  );
}
