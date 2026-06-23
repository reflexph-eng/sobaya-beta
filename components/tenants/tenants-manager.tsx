"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CreditCard, Edit3, Plus, Trash2, Users } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { TenantInvitationManager } from "@/components/tenants/tenant-invitation-manager";
import { SimpleTabs } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { listContracts } from "@/services/contracts";
import { listPayments } from "@/services/payments";
import { computeRentSituations } from "@/services/rent-arrears";
import { archiveTenant, createTenant, listTenants, updateTenant } from "@/services/tenants";
import { TenantForm } from "@/components/tenants/tenant-form";
import type { Contract } from "@/types/contract";
import type { Payment } from "@/types/payment";
import type { Tenant, TenantFormValues, TenantStatus } from "@/types/tenant";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

const statusLabels: Record<TenantStatus, string> = {
  active: "Actif",
  notice: "Préavis",
  exited: "Sorti",
  suspended: "Suspendu"
};

export function TenantsManager() {
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("search") ?? "").trim().toLowerCase();
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canCreate = isSuperAdmin || can(permissions, PERMISSIONS.TENANTS_CREATE);
  const canUpdate = isSuperAdmin || can(permissions, PERMISSIONS.TENANTS_UPDATE);
  const canDelete = isSuperAdmin || can(permissions, PERMISSIONS.SETTINGS_MANAGE);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [tenantsData, contractsData, paymentsData] = await Promise.all([
        listTenants(organization.id),
        listContracts(organization.id),
        listPayments(organization.id)
      ]);
      setTenants(tenantsData);
      setContracts(contractsData);
      setPayments(paymentsData);
    } catch {
      setError("Impossible de charger les locataires. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const tenantSituations = useMemo(() => {
    const activeContracts = contracts.filter((contract) => contract.status === "active" && contract.isDeleted !== true);
    const situations = computeRentSituations(activeContracts, payments);
    const byTenant = new Map<string, { totalDue: number; dueMonths: number; lastPaidLabel: string; propertyName: string; contractId: string; status: string }>();
    for (const situation of situations) {
      const contract = activeContracts.find((item) => item.id === situation.contractId);
      if (!contract?.tenantId) continue;
      const current = byTenant.get(contract.tenantId);
      const next = {
        totalDue: (current?.totalDue ?? 0) + situation.totalDue,
        dueMonths: (current?.dueMonths ?? 0) + situation.dueMonths.length,
        lastPaidLabel: situation.lastPaidLabel,
        propertyName: situation.propertyName,
        contractId: situation.contractId,
        status: situation.status
      };
      byTenant.set(contract.tenantId, next);
    }
    return byTenant;
  }, [contracts, payments]);

  const stats = useMemo(() => ({
    total: tenants.filter((item) => item.status !== "exited").length,
    active: tenants.filter((item) => item.status === "active").length,
    notice: tenants.filter((item) => item.status === "notice").length,
    exited: tenants.filter((item) => item.status === "exited").length,
    late: Array.from(tenantSituations.values()).filter((item) => item.totalDue > 0).length
  }), [tenantSituations, tenants]);

  const visibleTenants = useMemo(() => {
    if (!searchTerm) return tenants;
    return tenants.filter((tenant) => `${tenant.fullName} ${tenant.tenantNumber} ${tenant.phone} ${tenant.email}`.toLowerCase().includes(searchTerm));
  }, [tenants, searchTerm]);

  async function handleSubmit(values: TenantFormValues) {
    if (!organization?.id) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateTenant(organization.id, editing.id, values, { userId: firebaseUser?.uid, userName: profile?.displayName });
      } else {
        await createTenant(organization.id, values, { userId: firebaseUser?.uid, userName: profile?.displayName });
      }
      setShowForm(false);
      setEditing(null);
      await refresh();
    } catch {
      setError("Enregistrement impossible. Vérifiez vos permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tenant: Tenant) {
    if (!organization?.id || !confirm(`Archiver le locataire ${tenant.fullName} ?`)) return;
    setError("");
    try {
      await archiveTenant(organization.id, tenant, { userId: firebaseUser?.uid, userName: profile?.displayName });
      await refresh();
    } catch {
      setError("Archivage impossible. Vérifiez vos permissions.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Locataires" description="Centralisez les fiches locataires de votre organisation." />
      {canCreate ? (
        <div className="mb-6">
          <TenantInvitationManager onTenantCreated={refresh} />
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-sobaya-border" />
            <span className="text-xs text-sobaya-muted">ou ajouter manuellement</span>
            <div className="flex-1 border-t border-sobaya-border" />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total locataires" value={stats.total} helper="Fiches non sorties" />
        <MetricCard label="Actifs" value={stats.active} helper="Occupants actifs" />
        <MetricCard label="Préavis" value={stats.notice} helper="Départs annoncés" />
        <MetricCard label="Sortis" value={stats.exited} helper="Historique" />
        <MetricCard label="En retard" value={stats.late} helper="Situation locative" />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Liste des locataires</p>
            <p className="text-sm text-sobaya-muted">Chaque fiche est stockée dans l’organisation active.</p>
          </div>
          {canCreate ? <Button className="w-full sm:w-fit" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Ajouter un locataire</Button> : null}
        </div>

        {searchTerm ? <div className="mb-4"><StatusBadge tone="neutral">Recherche : « {searchParams.get("search")} »</StatusBadge></div> : null}

        {showForm ? (
          <div className="mb-5 rounded-2xl border border-sobaya-border p-4">
            <TenantForm tenant={editing} loading={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} />
          </div>
        ) : null}

        {loading ? <p className="text-sm text-sobaya-muted">Chargement des locataires...</p> : null}

        {!loading && tenants.length === 0 ? (
          <EmptyState
            icon={<Users size={34} />}
            title="Aucun locataire enregistré"
            description="Ajoutez votre premier locataire avant la création des contrats et des paiements."
            action={canCreate ? <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Ajouter un locataire</Button> : null}
          />
        ) : null}

        <div className="grid gap-3">
          {!loading && tenants.length > 0 && visibleTenants.length === 0 ? (
            <Card className="text-sm text-sobaya-muted">Aucun locataire ne correspond à la recherche.</Card>
          ) : null}
          {visibleTenants.map((tenant) => (
            <div key={tenant.id} className="rounded-2xl border border-sobaya-border p-4 transition hover:bg-sobaya-soft/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{tenant.fullName}</p>
                    <span className="rounded-full bg-sobaya-soft px-2 py-1 text-xs font-medium text-sobaya-muted">{tenant.tenantNumber ?? "SBY-LOC-—"}</span>
                    <StatusBadge>{statusLabels[tenant.status]}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-sobaya-muted">{tenant.phone}{tenant.email ? ` · ${tenant.email}` : ""}</p>
                  <div className="mt-3">
                    <SimpleTabs
                      tabs={[
                        { key: "profile", label: "Profil", content: <div className="grid gap-2 text-sm text-sobaya-muted sm:grid-cols-2"><p>Profession : <span className="text-sobaya-ink">{tenant.profession || "Non renseignée"}</span></p><p>Employeur : <span className="text-sobaya-ink">{tenant.employer || "Non renseigné"}</span></p><p>Score : <span className="text-sobaya-ink">{tenant.tenantScore ?? 50}/100</span></p><p>Identité : <span className="text-sobaya-ink">{tenant.identityVerified ? "vérifiée" : "à vérifier"}</span></p></div> },
                        { key: "contracts", label: "Contrats", content: <p className="text-sm text-sobaya-muted">{contracts.filter((contract) => contract.tenantId === tenant.id && contract.isDeleted !== true).length} contrat(s) rattaché(s).</p> },
                        { key: "payments", label: "Paiements", content: tenantSituations.get(tenant.id) ? <div className="text-sm">{tenantSituations.get(tenant.id)!.totalDue > 0 ? <p className="flex items-center gap-2 text-red-700"><AlertTriangle size={15} /> Dette actuelle : <span className="font-semibold">{money(tenantSituations.get(tenant.id)!.totalDue)}</span> · {tenantSituations.get(tenant.id)!.dueMonths} mois dû(s)</p> : <p className="text-emerald-700">Situation locative : à jour</p>}<p className="mt-1 text-xs text-sobaya-muted">Dernier mois payé : {tenantSituations.get(tenant.id)!.lastPaidLabel} · {tenantSituations.get(tenant.id)!.propertyName}</p></div> : <p className="text-sm text-sobaya-muted">Aucune situation locative active.</p> },
                        { key: "reminders", label: "Relances", content: <p className="text-sm text-sobaya-muted">{tenantSituations.get(tenant.id)?.totalDue ? "Relance recommandée depuis le module Impayés." : "Aucune relance prioritaire."}</p> }
                      ]}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {tenantSituations.get(tenant.id)?.totalDue ? <ButtonLink href="/impayes" variant="secondary"><CreditCard size={16} /> Relancer</ButtonLink> : null}
                  {canUpdate ? <Button variant="secondary" onClick={() => { setEditing(tenant); setShowForm(true); }}><Edit3 size={16} /> Modifier</Button> : null}
                  {canDelete ? <Button variant="secondary" onClick={() => handleDelete(tenant)}><Trash2 size={16} /> Archiver</Button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
