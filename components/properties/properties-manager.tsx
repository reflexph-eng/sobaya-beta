"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Edit3, Home, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { SimpleTabs } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { archiveProperty, createProperty, listProperties, updateProperty } from "@/services/properties";
import { listContracts } from "@/services/contracts";
import { listOwnerMandates } from "@/services/owner-mandates";
import { computePropertySituation } from "@/services/property-situation";
import { listMaintenanceInterventions } from "@/services/interventions";
import { PropertyForm } from "@/components/properties/property-form";
import { PropertyListingToggle } from "@/components/properties/property-listing-toggle";
import { FeaturedRequestButton } from "@/components/properties/featured-request-button";
import type { Property, PropertyFormValues } from "@/types/property";
import type { Contract } from "@/types/contract";
import type { MaintenanceIntervention } from "@/types/intervention";
import type { OwnerMandate } from "@/types/owner-mandate";

function situationTone(bucket: string) {
  if (bucket === "occupied") return "success";
  if (bucket === "maintenance") return "warning";
  if (bucket === "withdrawn") return "neutral";
  return undefined;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function PropertiesManager() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("etat") ?? "all";
  const mandantsOnly = searchParams.get("mandants") === "1";
  const searchTerm = (searchParams.get("search") ?? "").trim().toLowerCase();
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canCreate = isSuperAdmin || can(permissions, PERMISSIONS.PROPERTIES_CREATE);
  const canUpdate = isSuperAdmin || can(permissions, PERMISSIONS.PROPERTIES_UPDATE);
  const canDelete = isSuperAdmin || can(permissions, PERMISSIONS.PROPERTIES_DELETE);
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<OwnerMandate[]>([]);
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [propertyData, interventionData, contractData, ownerData] = await Promise.all([listProperties(organization.id), listMaintenanceInterventions(organization.id).catch(() => []), listContracts(organization.id).catch(() => []), listOwnerMandates(organization.id).catch(() => [])]);
      setProperties(propertyData);
      setOwners(ownerData);
      setInterventions(interventionData);
      setContracts(contractData);
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
    const situations = active.map((property) => computePropertySituation(property, contracts));
    const occupied = situations.filter((item) => item.dashboardBucket === "occupied").length;
    const available = situations.filter((item) => item.dashboardBucket === "available").length;
    const withdrawn = situations.filter((item) => item.dashboardBucket === "withdrawn").length;
    const maintenance = situations.filter((item) => item.dashboardBucket === "maintenance").length;
    const rentableBase = occupied + available;
    return { total: active.length, occupied, available, withdrawn, maintenance, rate: rentableBase ? Math.round((occupied / rentableBase) * 100) : 0 };
  }, [properties, contracts]);

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

  const visibleProperties = useMemo(() => {
    return properties.filter((property) => {
      if (property.status === "archived") return false;
      if (mandantsOnly && !property.ownerMandateId) return false;
      if (statusFilter !== "all" && computePropertySituation(property, contracts).dashboardBucket !== statusFilter) return false;
      if (searchTerm) {
        const haystack = `${property.name} ${property.reference} ${property.commune} ${property.city} ${property.ownerName}`.toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }
      return true;
    });
  }, [contracts, mandantsOnly, properties, searchTerm, statusFilter]);

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
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="Biens" description="Gérez le patrimoine immobilier rattaché à votre organisation." />
        <a
          href="/biens/carte"
          className="hidden shrink-0 items-center gap-2 rounded-xl border border-sobaya-border bg-white px-4 py-2 text-sm font-medium text-sobaya-ink transition hover:bg-sobaya-soft sm:inline-flex"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
          Vue carte
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total biens" value={stats.total} helper="Biens non archivés" href="/biens" />
        <MetricCard label="Occupés" value={stats.occupied} helper="Biens loués" href="/biens?etat=occupied" />
        <MetricCard label="Disponibles" value={stats.available} helper="Libres et louables" href="/biens?etat=available" />
        <MetricCard label="Taux occupation" value={`${stats.rate}%`} helper="Occupés / biens louables" href="/rapports?vue=occupation" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Retirés du marché" value={stats.withdrawn} helper="Libres mais non proposés" href="/biens?etat=withdrawn" />
        <MetricCard label="Maintenance" value={stats.maintenance} helper="Non exploitables" href="/biens?etat=maintenance" />
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

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { key: "all", label: "Tous" },
            { key: "occupied", label: "Occupés" },
            { key: "available", label: "Disponibles" },
            { key: "withdrawn", label: "Retirés" },
            { key: "maintenance", label: "Maintenance" }
          ].map((item) => (
            <Button key={item.key} type="button" variant={statusFilter === item.key ? "primary" : "secondary"} onClick={() => setStatusFilter(item.key)}>{item.label}</Button>
          ))}
          {mandantsOnly ? <StatusBadge tone="success">Biens confiés uniquement</StatusBadge> : null}
          {searchTerm ? <StatusBadge tone="neutral">Recherche : « {searchParams.get("search")} »</StatusBadge> : null}
        </div>

        {showForm ? (
          <div className="mb-5 rounded-2xl border border-sobaya-border p-4">
            <PropertyForm property={editing} owners={owners} loading={saving} organizationId={organization?.id} actor={{ userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined }} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} />
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
          {!loading && properties.length > 0 && visibleProperties.length === 0 ? (
            <Card className="text-sm text-sobaya-muted">Aucun bien ne correspond au filtre sélectionné.</Card>
          ) : null}
          {visibleProperties.map((property) => (
            <div key={property.id} className="rounded-2xl border border-sobaya-border p-4 transition hover:bg-sobaya-soft/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  {(() => {
                    const situation = computePropertySituation(property, contracts);
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{property.name}</p>
                          <StatusBadge tone={situationTone(situation.dashboardBucket) as any}>{situation.label}</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-sobaya-muted">{property.reference || "Référence non générée"} · {property.commune ? `${property.commune}, ` : ""}{property.city}</p>
                        <p className="mt-1 text-xs text-sobaya-muted">{situation.detail}</p>
                        {property.ownerName ? <p className="mt-1 text-xs text-sobaya-muted">Propriétaire : {property.ownerName}</p> : null}
                      </>
                    );
                  })()}
                  <div className="mt-3">
                    <SimpleTabs
                      tabs={[
                        { key: "general", label: "Général", content: <div className="grid gap-2 text-sm text-sobaya-muted sm:grid-cols-2"><p>Pièces : <span className="text-sobaya-ink">{property.rooms}</span></p><p>Loyer : <span className="text-sobaya-ink">{formatAmount(property.monthlyRent)}</span></p><p>Charges : <span className="text-sobaya-ink">{formatAmount(property.charges)}</span></p><p>Adresse : <span className="text-sobaya-ink">{property.address || "À compléter"}</span></p></div> },
                        { key: "owner", label: "Propriétaire", content: <div className="text-sm text-sobaya-muted"><p>Mandant : <span className="text-sobaya-ink">{property.ownerName || "Non rattaché"}</span></p><p className="mt-1">Référence mandat : <span className="text-sobaya-ink">{property.ownerMandateId || "—"}</span></p></div> },
                        { key: "contracts", label: "Contrats", content: <div className="text-sm text-sobaya-muted">{contracts.filter((contract) => contract.propertyId === property.id && contract.isDeleted !== true).length} contrat(s) rattaché(s). <span className="text-sobaya-ink">Statut affiché dans le module Contrats.</span></div> },
                        { key: "history", label: "Historique", content: interventions.filter((intervention) => intervention.propertyId === property.id).length > 0 ? <div className="grid gap-1">{interventions.filter((intervention) => intervention.propertyId === property.id).slice(0, 3).map((intervention) => <p key={intervention.id} className="text-xs text-sobaya-muted">{intervention.ticketTitle} · {intervention.providerName} · {formatAmount(intervention.finalCost || intervention.estimatedCost)}</p>)}</div> : <p className="text-sm text-sobaya-muted">Aucun historique technique récent.</p> }
                      ]}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {canUpdate ? <Button variant="secondary" onClick={() => { setEditing(property); setShowForm(true); }}><Edit3 size={16} /> Modifier</Button> : null}
                  {canDelete ? <Button variant="secondary" onClick={() => handleDelete(property)}><Trash2 size={16} /> Archiver</Button> : null}
                </div>
              </div>
              {canUpdate && organization?.id ? (
                <div className="mt-3 border-t border-sobaya-border pt-3">
                  <PropertyListingToggle
                    property={property}
                    organizationId={organization.id}
                    organizationName={organization.name}
                    organizationType={organization.type}
                    actor={{ userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined }}
                    onUpdated={refresh}
                  />
                  {property.publicListingId ? (
                    <FeaturedRequestButton
                      publicListingId={property.publicListingId}
                      propertyId={property.id}
                      organizationId={organization.id}
                      propertyName={property.name}
                      actor={{ userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
