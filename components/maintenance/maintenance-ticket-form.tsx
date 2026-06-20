"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { MaintenancePriority, MaintenanceStatus, MaintenanceTicket, MaintenanceTicketFormValues } from "@/types/maintenance";
import type { Contract } from "@/types/contract";
import { findActiveContractForProperty, propertyLabel } from "@/services/business-rules";

const emptyValues: MaintenanceTicketFormValues = {
  title: "",
  description: "",
  propertyId: "",
  tenantId: "",
  priority: "medium",
  status: "open",
  assignedTo: "",
  assignedPhone: "",
  dueDate: "",
  estimatedCost: 0,
  finalCost: 0,
  notes: ""
};

export const priorityLabels: Record<MaintenancePriority, string> = {
  low: "Faible",
  medium: "Normale",
  high: "Haute",
  urgent: "Urgente"
};

export const statusLabels: Record<MaintenanceStatus, string> = {
  open: "Ouvert",
  assigned: "Affecté",
  in_progress: "En cours",
  waiting: "En attente",
  resolved: "Résolu",
  closed: "Clôturé",
  cancelled: "Annulé"
};

export function MaintenanceTicketForm({
  ticket,
  properties,
  tenants,
  contracts,
  loading,
  onCancel,
  onSubmit
}: {
  ticket?: MaintenanceTicket | null;
  properties: Property[];
  tenants: Tenant[];
  contracts: Contract[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: MaintenanceTicketFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<MaintenanceTicketFormValues>(emptyValues);
  const activeContract = values.propertyId ? findActiveContractForProperty(contracts, values.propertyId) : undefined;
  const selectedTenant = tenants.find((tenant) => tenant.id === values.tenantId);

  useEffect(() => {
    if (ticket) {
      setValues({
        title: ticket.title ?? "",
        description: ticket.description ?? "",
        propertyId: ticket.propertyId ?? "",
        tenantId: ticket.tenantId ?? "",
        priority: ticket.priority ?? "medium",
        status: ticket.status ?? "open",
        assignedTo: ticket.assignedTo ?? "",
        assignedPhone: ticket.assignedPhone ?? "",
        dueDate: ticket.dueDate ?? "",
        estimatedCost: Number(ticket.estimatedCost ?? 0),
        finalCost: Number(ticket.finalCost ?? 0),
        notes: ticket.notes ?? ""
      });
    } else {
      const defaultPropertyId = properties[0]?.id ?? "";
      const defaultActiveContract = defaultPropertyId ? findActiveContractForProperty(contracts, defaultPropertyId) : undefined;
      setValues({ ...emptyValues, propertyId: defaultPropertyId, tenantId: defaultActiveContract?.tenantId ?? tenants[0]?.id ?? "" });
    }
  }, [ticket, properties, tenants, contracts]);

  function update<K extends keyof MaintenanceTicketFormValues>(key: K, value: MaintenanceTicketFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateProperty(propertyId: string) {
    const contract = findActiveContractForProperty(contracts, propertyId);
    setValues((current) => ({ ...current, propertyId, tenantId: contract?.tenantId ?? "" }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      ...values,
      estimatedCost: Number(values.estimatedCost || 0),
      finalCost: Number(values.finalCost || 0)
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Objet du ticket" required>
          <Input placeholder="Ex : Fuite d'eau salle de bain" value={values.title} onChange={(event) => update("title", event.target.value)} required />
        </FormField>
        <SelectField label="Bien concerné" required value={values.propertyId} onChange={(value) => updateProperty(value)}>
          <option value="" disabled>Sélectionner un bien</option>
          {properties.map((property) => {
            const contract = findActiveContractForProperty(contracts, property.id);
            return <option key={property.id} value={property.id}>{propertyLabel(property, contract)}</option>;
          })}
        </SelectField>
        <SelectField label="Locataire" required value={values.tenantId} onChange={(value) => update("tenantId", value)} help={activeContract ? "Prérempli automatiquement depuis le contrat actif du bien." : "Aucun contrat actif détecté pour ce bien : sélection manuelle."}>
          <option value="" disabled>Sélectionner un locataire</option>
          {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.fullName}{tenant.id === activeContract?.tenantId ? " · locataire actif" : ""}</option>)}
        </SelectField>
        <SelectField label="Priorité" value={values.priority} onChange={(value) => update("priority", value as MaintenancePriority)}>
          {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <SelectField label="Statut" value={values.status} onChange={(value) => update("status", value as MaintenanceStatus)}>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <FormField label="Échéance souhaitée">
          <Input type="date" value={values.dueDate} onChange={(event) => update("dueDate", event.target.value)} />
        </FormField>
        <FormField label="Affecté à">
          <Input placeholder="Technicien, artisan ou agent" value={values.assignedTo} onChange={(event) => update("assignedTo", event.target.value)} />
        </FormField>
        <FormField label="Téléphone intervenant">
          <Input placeholder="Ex : 0700000000" value={values.assignedPhone} onChange={(event) => update("assignedPhone", event.target.value)} />
        </FormField>
        <FormField label="Coût estimé (FCFA)">
          <Input type="number" min="0" value={values.estimatedCost} onChange={(event) => update("estimatedCost", Number(event.target.value))} />
        </FormField>
        <FormField label="Coût final (FCFA)">
          <Input type="number" min="0" value={values.finalCost} onChange={(event) => update("finalCost", Number(event.target.value))} />
        </FormField>
      </div>
      {values.propertyId ? (
        <p className="rounded-xl border border-sobaya-border bg-sobaya-soft/50 px-4 py-3 text-sm text-sobaya-ink">
          {activeContract ? <>Lien intelligent : {activeContract.propertyName} est occupé par <strong>{activeContract.tenantName}</strong> via le contrat {activeContract.contractNumber}.</> : <>Aucun contrat actif détecté pour ce bien. Vérifiez que le ticket concerne bien {selectedTenant?.fullName ?? "le locataire sélectionné"}.</>}
        </p>
      ) : null}
      <FormField label="Description" required>
        <textarea className="min-h-24 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={values.description} onChange={(event) => update("description", event.target.value)} required placeholder="Décrivez le problème, l'urgence et les détails utiles." />
      </FormField>
      <FormField label="Notes internes">
        <textarea className="min-h-20 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={values.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Suivi interne, consignes, devis, observations..." />
      </FormField>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading || !values.propertyId || !values.tenantId}>{loading ? "Enregistrement..." : ticket ? "Mettre à jour" : "Créer le ticket"}</Button>
      </div>
    </form>
  );
}
