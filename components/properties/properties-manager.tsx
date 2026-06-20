"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Home, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { archiveProperty, createProperty, listProperties, updateProperty } from "@/services/properties";
import { listMaintenanceInterventions } from "@/services/interventions";
import { PropertyForm } from "@/components/properties/property-form";
import type { Property, PropertyFormValues, PropertyStatus } from "@/types/property";
import type { MaintenanceIntervention } from "@/types/intervention";

const statusLabels: Record<PropertyStatus, string> = {
  available: "Disponible",
  occupied: "Occupé",
  maintenance: "En maintenance",
  archived: "Archivé"
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function PropertiesManager() {
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canCreate = isSuperAdmin || can(permissions, PERMISSIONS.PROPERTIES_CREATE);
  const canUpdate = isSuperAdmin || can(permissions, PERMISSIONS.PROPERTIES_UPDATE);
  const canDelete = isSuperAdmin || can(permissions, PERMISSIONS.PROPERTIES_DELETE);
  const [properties, setProperties] = useState<Property[]>([]);
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [propertyData, interventionData] = await Promise.all([listProperties(organization.id), listMaintenanceInterventions(organization.id).catch(() => [])]);
      setProperties(propertyData);
      setInterventions(interventionData);
    } catch {
      setError("Impossible de charger les biens. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const active = properties.filter((item) => item.status !== "archived");
    return {
      total: active.length,
      occupied: active.filter((item) => item.status === "occupied").length,
      available: active.filter((item) => item.status === "available").length,
      rate: active.length ? Math.round((active.filter((item) => item.status === "occupied").length / active.length) * 100) : 0
    };
  }, [properties]);

  async function handleSubmit(values: PropertyFormValues) {
    if (!organization?.id) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateProperty(organization.id, editing.id, values, { userId: firebaseUser?.uid, userName: profile?.displayName });
      } else {
        await createProperty(organization.id, values, { userId: firebaseUser?.uid, userName: profile?.displayName });
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

  async function handleDelete(property: Property) {
    if (!organization?.id || !confirm(`Archiver le bien ${property.name} ?`)) return;
    setError("");
    try {
      await archiveProperty(organization.id, property, { userId: firebaseUser?.uid, userName: profile?.displayName });
      await refresh();
    } catch {
      setError("Archivage impossible. Vérifiez vos permissions.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Biens" description="Gérez le patrimoine immobilier rattaché à votre organisation." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total biens" value={stats.total} helper="Biens non archivés" />
        <MetricCard label="Occupés" value={stats.occupied} helper="Biens loués" />
        <MetricCard label="Disponibles" value={stats.available} helper="Prêts à louer" />
        <MetricCard label="Taux occupation" value={`${stats.rate}%`} helper="Occupation actuelle" />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Liste des biens</p>
            <p className="text-sm text-sobaya-muted">Chaque bien est stocké dans l’organisation active.</p>
          </div>
          {canCreate ? (
            <Button className="w-full sm:w-fit" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Ajouter un bien</Button>
          ) : null}
        </div>

        {showForm ? (
          <div className="mb-5 rounded-2xl border border-sobaya-border p-4">
            <PropertyForm property={editing} loading={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} />
          </div>
        ) : null}

        {loading ? <p className="text-sm text-sobaya-muted">Chargement des biens...</p> : null}

        {!loading && properties.length === 0 ? (
          <EmptyState
            icon={<Home size={34} />}
            title="Aucun bien enregistré"
            description="Commencez par créer votre premier appartement, maison, bureau ou local commercial."
            action={canCreate ? <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Ajouter un bien</Button> : null}
          />
        ) : null}

        <div className="grid gap-3">
          {properties.map((property) => (
            <div key={property.id} className="rounded-2xl border border-sobaya-border p-4 transition hover:bg-sobaya-soft/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{property.name}</p>
                    <StatusBadge>{statusLabels[property.status]}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-sobaya-muted">{property.reference} · {property.commune ? `${property.commune}, ` : ""}{property.city}</p>
                  <p className="mt-2 text-sm text-sobaya-muted">{property.rooms} pièce(s) · {formatAmount(property.monthlyRent)} / mois · charges {formatAmount(property.charges)}</p>
                  {interventions.filter((intervention) => intervention.propertyId === property.id).length > 0 ? (
                    <div className="mt-3 rounded-xl border border-sobaya-border bg-white px-3 py-2">
                      <p className="text-xs font-medium text-sobaya-ink">Historique technique</p>
                      <div className="mt-1 grid gap-1">
                        {interventions.filter((intervention) => intervention.propertyId === property.id).slice(0, 3).map((intervention) => (
                          <p key={intervention.id} className="text-xs text-sobaya-muted">{intervention.ticketTitle} · {intervention.providerName} · {formatAmount(intervention.finalCost || intervention.estimatedCost)}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {canUpdate ? <Button variant="secondary" onClick={() => { setEditing(property); setShowForm(true); }}><Edit3 size={16} /> Modifier</Button> : null}
                  {canDelete ? <Button variant="secondary" onClick={() => handleDelete(property)}><Trash2 size={16} /> Archiver</Button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
