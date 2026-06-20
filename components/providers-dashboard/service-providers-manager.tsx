"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Star, Trash2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { archiveServiceProvider, createServiceProvider, listServiceProviders, updateServiceProvider } from "@/services/providers";
import type { ServiceProvider, ServiceProviderFormValues, ServiceProviderSpecialty } from "@/types/provider";
import { ServiceProviderForm, specialtyLabels } from "@/components/providers-dashboard/service-provider-form";

function providerTone(status: string) {
  if (status === "active") return "success";
  if (status === "inactive") return "warning";
  return "neutral";
}

export function ServiceProvidersManager() {
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canManage = isSuperAdmin || can(permissions, PERMISSIONS.PROVIDERS_MANAGE) || can(permissions, PERMISSIONS.MAINTENANCE_MANAGE);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceProvider | null>(null);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [status, setStatus] = useState("all");

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      setProviders(await listServiceProviders(organization.id));
    } catch (error) {
      console.error(error);
      setError("Impossible de charger les prestataires. Vérifiez les règles Firestore et les permissions.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const filteredProviders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return providers.filter((provider) => {
      const matchesSearch = !term || [provider.name, provider.company, provider.phone, provider.city].join(" ").toLowerCase().includes(term);
      const matchesSpecialty = specialty === "all" || provider.specialty === specialty;
      const matchesStatus = status === "all" || provider.status === status;
      return matchesSearch && matchesSpecialty && matchesStatus;
    });
  }, [providers, search, specialty, status]);

  const stats = useMemo(() => ({
    total: providers.length,
    active: providers.filter((item) => item.status === "active").length,
    rated: providers.filter((item) => Number(item.averageRating || 0) > 0).length,
    specialties: new Set(providers.map((item) => item.specialty)).size
  }), [providers]);

  async function handleSubmit(values: ServiceProviderFormValues) {
    if (!organization?.id) return;
    setSaving(true);
    setError("");
    try {
      const actor = { userId: firebaseUser?.uid, userName: profile?.displayName };
      if (editing) await updateServiceProvider(organization.id, editing.id, values, actor);
      else await createServiceProvider(organization.id, values, actor);
      setShowForm(false);
      setEditing(null);
      await refresh();
    } catch (error) {
      console.error(error);
      setError("Enregistrement du prestataire impossible. Vérifiez vos permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(provider: ServiceProvider) {
    if (!organization?.id || !confirm(`Archiver ${provider.name} ?`)) return;
    setError("");
    try {
      await archiveServiceProvider(organization.id, provider, { userId: firebaseUser?.uid, userName: profile?.displayName });
      await refresh();
    } catch {
      setError("Archivage du prestataire impossible. Vérifiez vos permissions.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Prestataires" description="Gérez les artisans et entreprises qui interviennent sur vos biens." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Prestataires" value={stats.total} compact helper="Annuaire interne" />
        <MetricCard label="Actifs" value={stats.active} compact helper="Disponibles pour affectation" />
        <MetricCard label="Notés" value={stats.rated} compact helper="Avec évaluation" />
        <MetricCard label="Spécialités" value={stats.specialties} compact helper="Domaines couverts" />
      </div>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Annuaire prestataires</p>
            <p className="text-sm text-sobaya-muted">Chaque prestataire reste cloisonné dans l&apos;organisation courante.</p>
          </div>
          {canManage ? <Button className="w-full sm:w-fit" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nouveau prestataire</Button> : null}
        </div>
        {showForm ? <div className="mb-5 rounded-2xl border border-sobaya-border p-4"><ServiceProviderForm provider={editing} loading={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} /></div> : null}
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <FormField label="Recherche">
            <div className="relative"><Search className="absolute left-3 top-3 text-sobaya-muted" size={17} /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, téléphone, ville..." /></div>
          </FormField>
          <SelectField label="Spécialité" value={specialty} onChange={setSpecialty}>
            <option value="all">Toutes</option>
            {Object.entries(specialtyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <SelectField label="Statut" value={status} onChange={setStatus}>
            <option value="all">Tous</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </SelectField>
        </div>
        {loading ? <p className="text-sm text-sobaya-muted">Chargement des prestataires...</p> : null}
        {!loading && filteredProviders.length === 0 ? <EmptyState icon={<UserCog size={34} />} title="Aucun prestataire" description="Créez votre annuaire pour affecter rapidement les interventions de maintenance." /> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {filteredProviders.map((provider) => (
            <div key={provider.id} className="rounded-2xl border border-sobaya-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-sobaya-muted">{provider.company || "Indépendant"} · {provider.phone}</p>
                </div>
                <StatusBadge tone={providerTone(provider.status)}>{provider.status === "active" ? "Actif" : "Inactif"}</StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-sobaya-muted">
                <StatusBadge>{specialtyLabels[provider.specialty as ServiceProviderSpecialty] ?? provider.specialty}</StatusBadge>
                <span>{provider.city || "Ville non renseignée"}</span>
                <span className="inline-flex items-center gap-1"><Star size={14} /> {Number(provider.averageRating || 0).toFixed(1)} / 5 ({provider.ratingCount || 0})</span>
              </div>
              {provider.notes ? <p className="mt-3 text-sm text-sobaya-muted">{provider.notes}</p> : null}
              {canManage ? <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { setEditing(provider); setShowForm(true); }}><Edit3 size={15} /> Modifier</Button><Button variant="ghost" onClick={() => handleArchive(provider)}><Trash2 size={15} /> Archiver</Button></div> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
