"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Hammer, Plus, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { archiveMaintenanceIntervention, createMaintenanceIntervention, listMaintenanceInterventions, updateMaintenanceIntervention } from "@/services/interventions";
import { listMaintenanceTickets } from "@/services/maintenance";
import { listServiceProviders } from "@/services/providers";
import type { MaintenanceIntervention, MaintenanceInterventionFormValues, MaintenanceInterventionStatus } from "@/types/intervention";
import type { MaintenanceTicket } from "@/types/maintenance";
import type { ServiceProvider } from "@/types/provider";
import { InterventionForm, interventionStatusLabels } from "@/components/interventions/intervention-form";
import { QuotePanel } from "@/components/interventions/quote-panel";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

function statusTone(status: MaintenanceInterventionStatus) {
  if (status === "completed") return "success";
  if (status === "cancelled") return "danger";
  if (status === "in_progress") return "warning";
  return "neutral";
}

export function InterventionsManager({ embedded = false, ticketId }: { embedded?: boolean; ticketId?: string; }) {
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canManage = isSuperAdmin || can(permissions, PERMISSIONS.INTERVENTIONS_MANAGE) || can(permissions, PERMISSIONS.MAINTENANCE_MANAGE);
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MaintenanceIntervention | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [interventionData, ticketData, providerData] = await Promise.all([
        listMaintenanceInterventions(organization.id),
        listMaintenanceTickets(organization.id),
        listServiceProviders(organization.id)
      ]);
      setInterventions(interventionData);
      setTickets(ticketData);
      setProviders(providerData);
    } catch (error) {
      console.error(error);
      setError("Impossible de charger les interventions. Vérifiez les règles Firestore et les permissions.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const visibleInterventions = useMemo(() => ticketId ? interventions.filter((item) => item.ticketId === ticketId) : interventions, [interventions, ticketId]);
  const stats = useMemo(() => ({
    planned: visibleInterventions.filter((item) => item.status === "planned").length,
    inProgress: visibleInterventions.filter((item) => item.status === "in_progress").length,
    completed: visibleInterventions.filter((item) => item.status === "completed").length,
    cost: visibleInterventions.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + Number(item.finalCost || item.estimatedCost || 0), 0)
  }), [visibleInterventions]);

  async function handleSubmit(values: MaintenanceInterventionFormValues) {
    if (!organization?.id) return;
    setSaving(true);
    setError("");
    try {
      const actor = { userId: firebaseUser?.uid, userName: profile?.displayName };
      if (editing) await updateMaintenanceIntervention(organization.id, editing.id, values, tickets, providers, actor);
      else await createMaintenanceIntervention(organization.id, values, tickets, providers, actor);
      setShowForm(false);
      setEditing(null);
      await refresh();
    } catch (error) {
      console.error(error);
      setError("Enregistrement de l&apos;intervention impossible. Vérifiez vos permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(intervention: MaintenanceIntervention) {
    if (!organization?.id || !confirm(`Archiver l&apos;intervention ${intervention.ticketTitle} ?`)) return;
    setError("");
    try {
      await archiveMaintenanceIntervention(organization.id, intervention, { userId: firebaseUser?.uid, userName: profile?.displayName });
      await refresh();
    } catch {
      setError("Archivage de l&apos;intervention impossible. Vérifiez vos permissions.");
    }
  }

  return (
    <div className="space-y-5">
      {!embedded ? <PageHeader title="Interventions" description="Affectez, suivez et évaluez les interventions terrain." /> : null}
      {!embedded ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Planifiées" value={stats.planned} compact helper="À venir" /><MetricCard label="En cours" value={stats.inProgress} compact helper="Suivi terrain" /><MetricCard label="Terminées" value={stats.completed} compact helper="Clôturées" /><MetricCard label="Coût total" value={money(stats.cost)} compact helper="Estimé ou final" /></div> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">{embedded ? "Interventions liées" : "Suivi des interventions"}</p>
            <p className="text-sm text-sobaya-muted">Les interventions héritent du ticket, du bien, du locataire et du prestataire.</p>
          </div>
          {canManage ? <Button className="w-full sm:w-fit" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nouvelle intervention</Button> : null}
        </div>
        {providers.length === 0 ? <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Créez d&apos;abord un prestataire actif avant d&apos;affecter une intervention. <ButtonLink href="/prestataires" variant="secondary" className="ml-2 min-h-8 px-3 py-1">Prestataires</ButtonLink></p> : null}
        {showForm ? <div className="mb-5 rounded-2xl border border-sobaya-border p-4"><InterventionForm intervention={editing} tickets={tickets} providers={providers} ticketId={ticketId} loading={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} /></div> : null}
        {loading ? <p className="text-sm text-sobaya-muted">Chargement des interventions...</p> : null}
        {!loading && visibleInterventions.length === 0 ? <EmptyState icon={<Hammer size={34} />} title="Aucune intervention" description="Affectez un prestataire à un ticket pour suivre les travaux, coûts et évaluations." /> : null}
        <div className="grid gap-3">
          {visibleInterventions.map((intervention) => (
            <div key={intervention.id} className="rounded-2xl border border-sobaya-border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{intervention.ticketTitle}</p><StatusBadge tone={statusTone(intervention.status)}>{interventionStatusLabels[intervention.status]}</StatusBadge></div>
                  <p className="mt-1 text-sm text-sobaya-muted">{intervention.propertyName} · {intervention.tenantName}</p>
                  <p className="mt-1 text-sm text-sobaya-muted">Prestataire : {intervention.providerName} · {intervention.providerSpecialty}</p>
                </div>
                <div className="text-left md:text-right"><p className="font-medium">{money(intervention.finalCost || intervention.estimatedCost)}</p><p className="text-xs text-sobaya-muted">{intervention.interventionDate || "Date non planifiée"}</p></div>
              </div>
              <p className="mt-3 text-sm text-sobaya-ink">{intervention.workDescription}</p>
              {intervention.rating > 0 ? <p className="mt-2 text-sm text-sobaya-muted">Évaluation : {'★'.repeat(intervention.rating)}{'☆'.repeat(Math.max(0, 5 - intervention.rating))} {intervention.ratingComment ? `· ${intervention.ratingComment}` : ""}</p> : null}
              {canManage && organization?.id ? (
                <QuotePanel
                  organizationId={organization.id}
                  intervention={intervention}
                  onUpdated={refresh}
                  actor={{ userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined }}
                />
              ) : null}
              {canManage ? <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { setEditing(intervention); setShowForm(true); }}><Edit3 size={15} /> Modifier</Button><Button variant="ghost" onClick={() => handleArchive(intervention)}><Trash2 size={15} /> Archiver</Button></div> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
