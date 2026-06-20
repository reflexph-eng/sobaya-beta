"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Edit3, Plus, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { listProperties } from "@/services/properties";
import { listTenants } from "@/services/tenants";
import { listContracts } from "@/services/contracts";
import { addMaintenanceLog, archiveMaintenanceTicket, createMaintenanceTicket, listMaintenanceLogs, listMaintenanceTickets, updateMaintenanceTicket } from "@/services/maintenance";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { Contract } from "@/types/contract";
import type { MaintenanceLog, MaintenancePriority, MaintenanceStatus, MaintenanceTicket, MaintenanceTicketFormValues } from "@/types/maintenance";
import { MaintenanceTicketForm, priorityLabels, statusLabels } from "@/components/maintenance/maintenance-ticket-form";
import { InterventionsManager } from "@/components/interventions/interventions-manager";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

function priorityTone(priority: MaintenancePriority) {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  if (priority === "low") return "neutral";
  return "success";
}

function statusTone(status: MaintenanceStatus) {
  if (["resolved", "closed"].includes(status)) return "success";
  if (["waiting", "assigned", "in_progress"].includes(status)) return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export function MaintenanceManager() {
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canManage = isSuperAdmin || can(permissions, PERMISSIONS.MAINTENANCE_MANAGE);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MaintenanceTicket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [logMessage, setLogMessage] = useState("");

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [ticketData, logData, propertyData, tenantData, contractData] = await Promise.all([
        listMaintenanceTickets(organization.id),
        listMaintenanceLogs(organization.id),
        listProperties(organization.id),
        listTenants(organization.id),
        listContracts(organization.id)
      ]);
      setTickets(ticketData);
      setLogs(logData);
      setProperties(propertyData);
      setTenants(tenantData);
      setContracts(contractData);
      setSelectedTicketId((current) => current ?? ticketData[0]?.id ?? null);
    } catch (error) {
      console.error(error);
      setError("Impossible de charger la maintenance. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const active = tickets.filter((ticket) => !["resolved", "closed", "cancelled"].includes(ticket.status));
    const urgent = tickets.filter((ticket) => ticket.priority === "urgent" && !["resolved", "closed", "cancelled"].includes(ticket.status)).length;
    const assigned = tickets.filter((ticket) => ticket.assignedTo.trim().length > 0 && !["closed", "cancelled"].includes(ticket.status)).length;
    const cost = tickets.filter((ticket) => ticket.status !== "cancelled").reduce((sum, ticket) => sum + Number(ticket.finalCost || ticket.estimatedCost || 0), 0);
    return { active: active.length, urgent, assigned, cost };
  }, [tickets]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0] ?? null;
  const selectedLogs = selectedTicket ? logs.filter((log) => log.ticketId === selectedTicket.id) : [];

  async function handleSubmit(values: MaintenanceTicketFormValues) {
    if (!organization?.id) return;
    setSaving(true);
    setError("");
    try {
      const actor = { userId: firebaseUser?.uid, userName: profile?.displayName };
      if (editing) {
        await updateMaintenanceTicket(organization.id, editing.id, values, properties, tenants, actor);
      } else {
        const ref = await createMaintenanceTicket(organization.id, values, properties, tenants, actor);
        setSelectedTicketId(ref.id);
      }
      setShowForm(false);
      setEditing(null);
      await refresh();
    } catch (error) {
      console.error(error);
      setError("Enregistrement du ticket impossible. Vérifiez vos permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(ticket: MaintenanceTicket) {
    if (!organization?.id || !confirm(`Archiver le ticket ${ticket.title} ?`)) return;
    setError("");
    try {
      await archiveMaintenanceTicket(organization.id, ticket, { userId: firebaseUser?.uid, userName: profile?.displayName });
      await refresh();
    } catch {
      setError("Archivage du ticket impossible. Vérifiez vos permissions.");
    }
  }

  async function handleAddLog() {
    if (!organization?.id || !selectedTicket || !logMessage.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addMaintenanceLog(organization.id, selectedTicket.id, selectedTicket.title, { status: selectedTicket.status, message: logMessage }, { userId: firebaseUser?.uid, userName: profile?.displayName });
      setLogMessage("");
      await refresh();
    } catch {
      setError("Ajout de l'historique impossible. Vérifiez vos permissions.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Maintenance" description="Pilotez les tickets, priorités, affectations et historiques d'intervention." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tickets actifs" value={stats.active} compact helper="Ouverts, affectés ou en cours" />
        <MetricCard label="Urgences" value={stats.urgent} compact helper="Priorité urgente non clôturée" />
        <MetricCard label="Affectations" value={stats.assigned} compact helper="Tickets avec intervenant" />
        <MetricCard label="Budget maintenance" value={money(stats.cost)} compact helper="Estimé ou final" />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Dashboard Maintenance</p>
            <p className="text-sm text-sobaya-muted">Les données restent cloisonnées dans l&apos;organisation courante.</p>
          </div>
          {canManage ? <Button className="w-full sm:w-fit" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nouveau ticket</Button> : null}
        </div>

        {properties.length === 0 || tenants.length === 0 ? (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Créez au moins un bien et un locataire avant d&apos;ouvrir un ticket de maintenance complet.</p>
        ) : null}

        {showForm ? (
          <div className="mb-5 rounded-2xl border border-sobaya-border p-4">
            <MaintenanceTicketForm ticket={editing} properties={properties} tenants={tenants} contracts={contracts} loading={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} />
          </div>
        ) : null}

        {loading ? <p className="text-sm text-sobaya-muted">Chargement de la maintenance...</p> : null}

        {!loading && tickets.length === 0 ? (
          <EmptyState
            icon={<Wrench size={34} />}
            title="Aucun ticket de maintenance"
            description="Créez un ticket pour suivre une panne, une intervention ou une demande locataire."
            action={canManage && properties.length > 0 && tenants.length > 0 ? <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nouveau ticket</Button> : null}
          />
        ) : null}

        <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-3">
            {tickets.map((ticket) => (
              <button key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className="rounded-2xl border border-sobaya-border p-4 text-left transition hover:bg-sobaya-soft/60">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{ticket.title}</p>
                      <StatusBadge tone={statusTone(ticket.status)}>{statusLabels[ticket.status]}</StatusBadge>
                      <StatusBadge tone={priorityTone(ticket.priority)}>{priorityLabels[ticket.priority]}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-sobaya-muted">{ticket.propertyName} · {ticket.tenantName}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-sobaya-muted">{ticket.description}</p>
                    <p className="mt-2 text-xs text-sobaya-muted">Affecté : {ticket.assignedTo || "Non affecté"}{ticket.dueDate ? ` · Échéance : ${ticket.dueDate}` : ""}</p>
                  </div>
                  {canManage ? (
                    <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                      <Button type="button" variant="secondary" onClick={() => { setEditing(ticket); setShowForm(true); }}><Edit3 size={16} /> Modifier</Button>
                      <Button type="button" variant="secondary" onClick={() => handleArchive(ticket)}><Trash2 size={16} /> Archiver</Button>
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-sobaya-border p-4">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} />
              <p className="font-medium">Historique</p>
            </div>
            {selectedTicket ? (
              <>
                <p className="mb-3 text-sm text-sobaya-muted">{selectedTicket.title}</p>
                {canManage ? (
                  <div className="mb-4 grid gap-2">
                    <textarea className="min-h-20 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" placeholder="Ajouter une note d&apos;intervention..." value={logMessage} onChange={(event) => setLogMessage(event.target.value)} />
                    <Button type="button" disabled={saving || !logMessage.trim()} onClick={handleAddLog}>Ajouter à l&apos;historique</Button>
                  </div>
                ) : null}
                <div className="grid gap-3">
                  {selectedLogs.length === 0 ? <p className="text-sm text-sobaya-muted">Aucun historique pour ce ticket.</p> : null}
                  {selectedLogs.map((log) => (
                    <div key={log.id} className="rounded-xl bg-sobaya-soft p-3">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <StatusBadge tone={statusTone(log.status)}>{statusLabels[log.status]}</StatusBadge>
                        <span className="text-xs text-sobaya-muted">{log.createdByName ?? "Utilisateur SOBAYA"}</span>
                      </div>
                      <p className="text-sm text-sobaya-ink">{log.message}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-sm text-sobaya-muted">Sélectionnez un ticket pour voir son historique.</p>}
          </div>
        </div>
      </Card>

      {selectedTicket ? <InterventionsManager embedded ticketId={selectedTicket.id} /> : null}
    </div>
  );
}
