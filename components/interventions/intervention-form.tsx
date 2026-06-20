"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { MaintenanceIntervention, MaintenanceInterventionFormValues, MaintenanceInterventionStatus } from "@/types/intervention";
import type { MaintenanceTicket } from "@/types/maintenance";
import type { ServiceProvider } from "@/types/provider";
import { specialtyLabels } from "@/components/providers-dashboard/service-provider-form";

const emptyValues: MaintenanceInterventionFormValues = {
  ticketId: "",
  providerId: "",
  interventionDate: "",
  workDescription: "",
  estimatedCost: 0,
  finalCost: 0,
  status: "planned",
  rating: 0,
  ratingComment: ""
};

export const interventionStatusLabels: Record<MaintenanceInterventionStatus, string> = {
  planned: "Planifiée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée"
};

export function InterventionForm({ intervention, tickets, providers, ticketId, loading, onCancel, onSubmit }: { intervention?: MaintenanceIntervention | null; tickets: MaintenanceTicket[]; providers: ServiceProvider[]; ticketId?: string; loading?: boolean; onCancel: () => void; onSubmit: (values: MaintenanceInterventionFormValues) => Promise<void>; }) {
  const [values, setValues] = useState<MaintenanceInterventionFormValues>(emptyValues);
  const activeProviders = useMemo(() => providers.filter((provider) => provider.status === "active"), [providers]);
  const selectedTicket = tickets.find((ticket) => ticket.id === values.ticketId);
  const selectedProvider = providers.find((provider) => provider.id === values.providerId);

  useEffect(() => {
    if (intervention) {
      setValues({
        ticketId: intervention.ticketId ?? "",
        providerId: intervention.providerId ?? "",
        interventionDate: intervention.interventionDate ?? "",
        workDescription: intervention.workDescription ?? "",
        estimatedCost: Number(intervention.estimatedCost ?? 0),
        finalCost: Number(intervention.finalCost ?? 0),
        status: intervention.status ?? "planned",
        rating: Number(intervention.rating ?? 0),
        ratingComment: intervention.ratingComment ?? ""
      });
    } else {
      setValues({ ...emptyValues, ticketId: ticketId ?? tickets[0]?.id ?? "", providerId: activeProviders[0]?.id ?? providers[0]?.id ?? "" });
    }
  }, [intervention, ticketId, tickets, providers, activeProviders]);

  function update<K extends keyof MaintenanceInterventionFormValues>(key: K, value: MaintenanceInterventionFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      ...values,
      estimatedCost: Number(values.estimatedCost || 0),
      finalCost: Number(values.finalCost || 0),
      rating: Number(values.rating || 0)
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Ticket maintenance" required value={values.ticketId} onChange={(value) => update("ticketId", value)} disabled={Boolean(ticketId)}>
          <option value="" disabled>Sélectionner un ticket</option>
          {tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.title} · {ticket.propertyName}</option>)}
        </SelectField>
        <SelectField label="Prestataire" required value={values.providerId} onChange={(value) => update("providerId", value)}>
          <option value="" disabled>Sélectionner un prestataire</option>
          {providers.map((provider) => <option key={provider.id} value={provider.id} disabled={provider.status !== "active"}>{provider.name} · {specialtyLabels[provider.specialty] ?? provider.specialty}{provider.status !== "active" ? " · indisponible" : ""}</option>)}
        </SelectField>
        <FormField label="Date d&apos;intervention">
          <Input type="date" value={values.interventionDate} onChange={(event) => update("interventionDate", event.target.value)} />
        </FormField>
        <SelectField label="Statut" value={values.status} onChange={(value) => update("status", value as MaintenanceInterventionStatus)}>
          {Object.entries(interventionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <FormField label="Coût estimé (FCFA)">
          <Input type="number" min="0" value={values.estimatedCost} onChange={(event) => update("estimatedCost", Number(event.target.value))} />
        </FormField>
        <FormField label="Coût final (FCFA)">
          <Input type="number" min="0" value={values.finalCost} onChange={(event) => update("finalCost", Number(event.target.value))} />
        </FormField>
        <SelectField label="Évaluation" value={String(values.rating)} onChange={(value) => update("rating", Number(value))} help="À renseigner après une intervention terminée.">
          <option value="0">Non évaluée</option>
          <option value="1">1 étoile</option>
          <option value="2">2 étoiles</option>
          <option value="3">3 étoiles</option>
          <option value="4">4 étoiles</option>
          <option value="5">5 étoiles</option>
        </SelectField>
      </div>
      {selectedTicket ? <p className="rounded-xl border border-sobaya-border bg-sobaya-soft/50 px-4 py-3 text-sm text-sobaya-ink">Lien intelligent : {selectedTicket.propertyName} · locataire {selectedTicket.tenantName}. L&apos;intervention héritera automatiquement du ticket, du bien et du locataire.</p> : null}
      {selectedProvider ? <p className="rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm text-sobaya-muted">Prestataire : {selectedProvider.name} · {selectedProvider.phone} · {specialtyLabels[selectedProvider.specialty] ?? selectedProvider.specialty}</p> : null}
      <FormField label="Travaux à réaliser" required>
        <textarea className="min-h-24 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={values.workDescription} onChange={(event) => update("workDescription", event.target.value)} required placeholder="Décrire l'intervention, le devis, les pièces ou les consignes..." />
      </FormField>
      <FormField label="Commentaire d'évaluation">
        <textarea className="min-h-20 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={values.ratingComment} onChange={(event) => update("ratingComment", event.target.value)} placeholder="Qualité, respect du délai, propreté, coût..." />
      </FormField>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading || !values.ticketId || !values.providerId || !values.workDescription}>{loading ? "Enregistrement..." : intervention ? "Mettre à jour" : "Créer l'intervention"}</Button>
      </div>
    </form>
  );
}
