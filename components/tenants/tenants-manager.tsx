"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { archiveTenant, createTenant, listTenants, updateTenant } from "@/services/tenants";
import { TenantForm } from "@/components/tenants/tenant-form";
import type { Tenant, TenantFormValues, TenantStatus } from "@/types/tenant";

const statusLabels: Record<TenantStatus, string> = {
  active: "Actif",
  notice: "Préavis",
  exited: "Sorti",
  suspended: "Suspendu"
};

export function TenantsManager() {
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canCreate = isSuperAdmin || can(permissions, PERMISSIONS.TENANTS_CREATE);
  const canUpdate = isSuperAdmin || can(permissions, PERMISSIONS.TENANTS_UPDATE);
  const canDelete = isSuperAdmin || can(permissions, PERMISSIONS.SETTINGS_MANAGE);
  const [tenants, setTenants] = useState<Tenant[]>([]);
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
      setTenants(await listTenants(organization.id));
    } catch {
      setError("Impossible de charger les locataires. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => ({
    total: tenants.filter((item) => item.status !== "exited").length,
    active: tenants.filter((item) => item.status === "active").length,
    notice: tenants.filter((item) => item.status === "notice").length,
    exited: tenants.filter((item) => item.status === "exited").length
  }), [tenants]);

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total locataires" value={stats.total} helper="Fiches non sorties" />
        <MetricCard label="Actifs" value={stats.active} helper="Occupants actifs" />
        <MetricCard label="Préavis" value={stats.notice} helper="Départs annoncés" />
        <MetricCard label="Sortis" value={stats.exited} helper="Historique" />
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
          {tenants.map((tenant) => (
            <div key={tenant.id} className="rounded-2xl border border-sobaya-border p-4 transition hover:bg-sobaya-soft/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{tenant.fullName}</p>
                    <StatusBadge>{statusLabels[tenant.status]}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-sobaya-muted">{tenant.phone}{tenant.email ? ` · ${tenant.email}` : ""}</p>
                  <p className="mt-2 text-sm text-sobaya-muted">{tenant.profession || "Profession non renseignée"}{tenant.employer ? ` · ${tenant.employer}` : ""}</p>
                  <p className="mt-2 text-xs text-sobaya-muted">Score initial : {tenant.tenantScore ?? 50}/100 · Identité {tenant.identityVerified ? "vérifiée" : "à vérifier"}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
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
