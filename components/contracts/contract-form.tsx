"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { Contract, ContractFormValues, ContractOnboardingMode, ContractStatus, PaymentMethod } from "@/types/contract";
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
  notes: "",
  onboardingMode: "new",
  realContractStartDate: "",
  migrationLastPaymentAmount: 0,
  migrationLastPaidPeriodStart: "",
  migrationLastPaidPeriodEnd: "",
  migrationBalance: 0,
  migrationDeposit: 0,
  migrationAdvance: 0
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
  const selectedPropertyBlocked = selectedProperty && values.status === "active" && !activeContractForSelectedProperty && (selectedProperty.availabilityStatus === "withdrawn" || selectedProperty.operationalStatus === "maintenance" || selectedProperty.status === "maintenance");

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
        notes: contract.notes,
        onboardingMode: contract.onboardingMode ?? "new",
        realContractStartDate: contract.realContractStartDate ?? contract.startDate,
        migrationLastPaymentAmount: contract.migrationLastPaymentAmount ?? 0,
        migrationLastPaidPeriodStart: contract.migrationLastPaidPeriodStart ?? "",
        migrationLastPaidPeriodEnd: contract.migrationLastPaidPeriodEnd ?? "",
        migrationBalance: contract.migrationBalance ?? 0,
        migrationDeposit: contract.migrationDeposit ?? contract.deposit ?? 0,
        migrationAdvance: contract.migrationAdvance ?? contract.advance ?? 0
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
    if (!values.propertyId || !values.tenantId || !values.startDate || !values.endDate) {
      setError("Renseignez le bien, le locataire et les dates du contrat.");
      return;
    }
    if (values.onboardingMode === "existing" && values.migrationLastPaidPeriodStart && values.migrationLastPaidPeriodEnd && new Date(values.migrationLastPaidPeriodEnd) < new Date(values.migrationLastPaidPeriodStart)) {
      setError("La fin de la dernière période payée doit être postérieure ou égale au début.");
      return;
    }
    if (values.status === "active" && activeContractForSelectedProperty) {
      setError(`Ce bien est déjà occupé par ${activeContractForSelectedProperty.tenantName} via le contrat ${activeContractForSelectedProperty.contractNumber}.`);
      return;
    }
    if (selectedPropertyBlocked) {
      setError("Ce bien n'est pas louable actuellement : il est retiré du marché ou en maintenance. Modifiez d'abord sa disponibilité dans la fiche bien.");
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
        dueDay: Number(values.dueDay),
        onboardingMode: values.onboardingMode ?? "new",
        realContractStartDate: values.onboardingMode === "existing" ? (values.realContractStartDate || values.startDate) : values.startDate,
        migrationLastPaymentAmount: Number(values.migrationLastPaymentAmount || 0),
        migrationLastPaidPeriodStart: values.migrationLastPaidPeriodStart || "",
        migrationLastPaidPeriodEnd: values.migrationLastPaidPeriodEnd || "",
        migrationBalance: Number(values.migrationBalance || 0),
        migrationDeposit: Number(values.migrationDeposit || values.deposit || 0),
        migrationAdvance: Number(values.migrationAdvance || values.advance || 0)
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
        <FormField label="Numéro du contrat" help="Généré automatiquement à la création. Vous pouvez le personnaliser uniquement en modification.">
          <Input value={values.contractNumber} onChange={(event) => update("contractNumber", event.target.value)} placeholder={contract ? "Ex : SBY-CTR-0001" : "Automatique : SBY-CTR-0001"} disabled={!contract} />
        </FormField>
        <SelectField label="Statut du contrat" value={values.status} onChange={(value) => update("status", value as ContractStatus)}>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField label="Bien concerné" required value={values.propertyId} onChange={(value) => update("propertyId", value)} help="Le contrat sera rattaché à ce bien.">
          <option value="">Choisir un bien</option>
          {properties.map((property) => {
            const activeContract = findActiveContractForProperty(contracts, property.id, contract?.id);
            const blocked = property.availabilityStatus === "withdrawn" || property.operationalStatus === "maintenance" || property.status === "maintenance";
            const disabled = Boolean(values.status === "active" && (activeContract || blocked));
            return <option key={property.id} value={property.id} disabled={disabled}>{propertyLabel(property, activeContract)}{blocked && !activeContract ? " · non louable" : ""}</option>;
          })}
        </SelectField>
        <SelectField label="Locataire concerné" required value={values.tenantId} onChange={(value) => update("tenantId", value)} help="Le contrat sera rattaché à ce locataire.">
          <option value="">Choisir un locataire</option>
          {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.tenantNumber ? `${tenant.tenantNumber} — ` : ""}{tenant.fullName} — {tenant.phone}</option>)}
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

      <div className="rounded-2xl border border-sobaya-border bg-sobaya-soft/40 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Type de reprise" value={values.onboardingMode ?? "new"} onChange={(value) => update("onboardingMode", value as ContractOnboardingMode)} help="Pour un locataire déjà en place, SOBAYA reprend la situation à partir de la dernière période payée.">
            <option value="new">Nouveau contrat SOBAYA</option>
            <option value="existing">Contrat existant avant SOBAYA</option>
          </SelectField>
          {values.onboardingMode === "existing" ? (
            <FormField label="Date réelle de début" help="Date à laquelle le contrat a réellement commencé, même avant SOBAYA.">
              <Input type="date" value={values.realContractStartDate ?? ""} onChange={(event) => update("realContractStartDate", event.target.value)} />
            </FormField>
          ) : null}
        </div>
        {values.onboardingMode === "existing" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField label="Dernier paiement avant SOBAYA (FCFA)" help="Montant du dernier paiement connu avant la reprise dans SOBAYA.">
              <Input type="number" min="0" value={values.migrationLastPaymentAmount ?? 0} onChange={(event) => update("migrationLastPaymentAmount", Number(event.target.value))} />
            </FormField>
            <FormField label="Solde initial restant dû (FCFA)" help="À renseigner si le locataire avait déjà une dette au moment de la reprise.">
              <Input type="number" min="0" value={values.migrationBalance ?? 0} onChange={(event) => update("migrationBalance", Number(event.target.value))} />
            </FormField>
            <FormField label="Dernière période payée du" help="Début de la période couverte par le dernier paiement connu.">
              <Input type="date" value={values.migrationLastPaidPeriodStart ?? ""} onChange={(event) => update("migrationLastPaidPeriodStart", event.target.value)} />
            </FormField>
            <FormField label="Au" help="Fin de la période couverte. SOBAYA suivra automatiquement le mois suivant.">
              <Input type="date" value={values.migrationLastPaidPeriodEnd ?? ""} onChange={(event) => update("migrationLastPaidPeriodEnd", event.target.value)} />
            </FormField>
            <FormField label="Caution déjà reçue (FCFA)">
              <Input type="number" min="0" value={values.migrationDeposit ?? values.deposit ?? 0} onChange={(event) => update("migrationDeposit", Number(event.target.value))} />
            </FormField>
            <FormField label="Avance déjà reçue (FCFA)">
              <Input type="number" min="0" value={values.migrationAdvance ?? values.advance ?? 0} onChange={(event) => update("migrationAdvance", Number(event.target.value))} />
            </FormField>
          </div>
        ) : null}
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
