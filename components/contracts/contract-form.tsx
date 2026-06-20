"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { Contract, ContractFormValues, ContractStatus, PaymentMethod } from "@/types/contract";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import { findActiveContractForProperty, propertyLabel } from "@/services/business-rules";

const statusOptions: { value: ContractStatus; label: string }[] = [
  { value: "draft", label: "Brouillon" },
  { value: "active", label: "Actif" },
  { value: "expired", label: "Expiré" },
  { value: "suspended", label: "Suspendu" },
  { value: "terminated", label: "Résilié" }
];

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Espèces" },
  { value: "bank_transfer", label: "Virement" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Chèque" },
  { value: "other", label: "Autre" }
];

const emptyValues: ContractFormValues = {
  contractNumber: "",
  propertyId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  monthlyRent: 0,
  charges: 0,
  deposit: 0,
  advance: 0,
  dueDay: 5,
  paymentMethod: "mobile_money",
  status: "draft",
  notes: ""
};

export function ContractForm({
  contract,
  properties,
  tenants,
  contracts,
  onSubmit,
  onCancel
}: {
  contract?: Contract | null;
  properties: Property[];
  tenants: Tenant[];
  contracts: Contract[];
  onSubmit: (values: ContractFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<ContractFormValues>(emptyValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeContractForSelectedProperty = values.propertyId ? findActiveContractForProperty(contracts, values.propertyId, contract?.id) : undefined;
  const selectedProperty = properties.find((property) => property.id === values.propertyId);

  useEffect(() => {
    if (contract) {
      setValues({
        contractNumber: contract.contractNumber,
        propertyId: contract.propertyId,
        tenantId: contract.tenantId,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent,
        charges: contract.charges,
        deposit: contract.deposit,
        advance: contract.advance,
        dueDay: contract.dueDay,
        paymentMethod: contract.paymentMethod,
        status: contract.status,
        notes: contract.notes
      });
    } else {
      setValues(emptyValues);
    }
  }, [contract]);

  function update<K extends keyof ContractFormValues>(key: K, value: ContractFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!values.contractNumber || !values.propertyId || !values.tenantId || !values.startDate || !values.endDate) {
      setError("Renseignez le numéro, le bien, le locataire et les dates du contrat.");
      return;
    }
    if (values.status === "active" && activeContractForSelectedProperty) {
      setError(`Ce bien est déjà occupé par ${activeContractForSelectedProperty.tenantName} via le contrat ${activeContractForSelectedProperty.contractNumber}.`);
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        ...values,
        monthlyRent: Number(values.monthlyRent),
        charges: Number(values.charges),
        deposit: Number(values.deposit),
        advance: Number(values.advance),
        dueDay: Number(values.dueDay)
      });
      if (!contract) setValues(emptyValues);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Impossible d'enregistrer le contrat pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Numéro du contrat" required help="Identifiant interne du contrat dans SOBAYA.">
          <Input value={values.contractNumber} onChange={(event) => update("contractNumber", event.target.value)} placeholder="Ex : SOB-CTR-001" required />
        </FormField>
        <SelectField label="Statut du contrat" value={values.status} onChange={(value) => update("status", value as ContractStatus)}>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField label="Bien concerné" required value={values.propertyId} onChange={(value) => update("propertyId", value)} help="Le contrat sera rattaché à ce bien.">
          <option value="">Choisir un bien</option>
          {properties.map((property) => {
            const activeContract = findActiveContractForProperty(contracts, property.id, contract?.id);
            const disabled = Boolean(activeContract && values.status === "active");
            return <option key={property.id} value={property.id} disabled={disabled}>{propertyLabel(property, activeContract)}</option>;
          })}
        </SelectField>
        <SelectField label="Locataire concerné" required value={values.tenantId} onChange={(value) => update("tenantId", value)} help="Le contrat sera rattaché à ce locataire.">
          <option value="">Choisir un locataire</option>
          {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.fullName} — {tenant.phone}</option>)}
        </SelectField>
        <FormField label="Date de début du contrat" required>
          <Input type="date" value={values.startDate} onChange={(event) => update("startDate", event.target.value)} required />
        </FormField>
        <FormField label="Date de fin du contrat" required>
          <Input type="date" value={values.endDate} onChange={(event) => update("endDate", event.target.value)} required />
        </FormField>
        <FormField label="Loyer mensuel (FCFA)" required help="Montant du loyer hors charges.">
          <Input type="number" min="0" placeholder="Ex : 250000" value={values.monthlyRent} onChange={(event) => update("monthlyRent", Number(event.target.value))} required />
        </FormField>
        <FormField label="Charges mensuelles (FCFA)" help="Laissez 0 si aucune charge n'est facturée.">
          <Input type="number" min="0" placeholder="Ex : 15000" value={values.charges} onChange={(event) => update("charges", Number(event.target.value))} />
        </FormField>
        <FormField label="Montant de la caution (FCFA)" help="Garantie versée par le locataire à l'entrée.">
          <Input type="number" min="0" placeholder="Ex : 500000" value={values.deposit} onChange={(event) => update("deposit", Number(event.target.value))} />
        </FormField>
        <FormField label="Montant de l'avance (FCFA)" help="Avance de loyer payée au démarrage du contrat.">
          <Input type="number" min="0" placeholder="Ex : 250000" value={values.advance} onChange={(event) => update("advance", Number(event.target.value))} />
        </FormField>
        <FormField label="Jour de paiement mensuel" required help="Ex : 5 signifie que le locataire doit payer chaque mois avant le 5.">
          <Input type="number" min={1} max={28} placeholder="Ex : 5" value={values.dueDay} onChange={(event) => update("dueDay", Number(event.target.value))} required />
        </FormField>
        <SelectField label="Mode de paiement préféré" value={values.paymentMethod} onChange={(value) => update("paymentMethod", value as PaymentMethod)}>
          {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
      </div>
      {activeContractForSelectedProperty ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Attention : {selectedProperty?.name ?? "ce bien"} est déjà lié au contrat actif {activeContractForSelectedProperty.contractNumber} avec {activeContractForSelectedProperty.tenantName}. Il faut archiver ou résilier ce contrat avant de créer un nouveau contrat actif sur le même bien.</p> : null}
      <FormField label="Observations" help="Conditions particulières, remarques, clauses ou informations utiles.">
        <textarea className="min-h-24 rounded-xl border border-sobaya-border bg-white px-3 py-3 text-sm outline-none transition focus:border-sobaya-primary" value={values.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Ex : Paiement par Mobile Money avant le 5 de chaque mois." />
      </FormField>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button> : null}
        <Button disabled={loading}>{loading ? "Enregistrement..." : contract ? "Mettre à jour" : "Créer le contrat"}</Button>
      </div>
    </form>
  );
}
