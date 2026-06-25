"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { DASHBOARD_WIDGETS, defaultDashboardWidgetsForProfile } from "@/services/dashboard-config";
import { updateOrganizationDashboardSettings } from "@/services/organizations";
import type { DashboardProfileKey, DashboardWidgetKey } from "@/types/organization";

const profiles: { key: DashboardProfileKey; label: string; help: string }[] = [
  { key: "owner", label: "Particulier", help: "Propriétaire qui gère ses propres biens." },
  { key: "agent", label: "Agent immobilier", help: "Agent qui gère un portefeuille confié." },
  { key: "agency", label: "Agence immobilière", help: "Structure avec propriétaires mandants, commissions et reversements." },
  { key: "super_admin", label: "Super admin", help: "Pilotage plateforme et préparation des futurs plans." }
];

export function DashboardWidgetsSettings() {
  const { organization, member, profile, refreshSession } = useAuth();
  const [activeProfile, setActiveProfile] = useState<DashboardProfileKey>("owner");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Seul le super admin peut voir et modifier la configuration des rubriques
  const canEdit = profile?.globalRole === "super_admin";

  const initialWidgets = useMemo(() => {
    return profiles.reduce((acc, profile) => {
      acc[profile.key] = organization?.dashboardSettings?.enabledWidgets?.[profile.key] ?? defaultDashboardWidgetsForProfile(profile.key);
      return acc;
    }, {} as Record<DashboardProfileKey, DashboardWidgetKey[]>);
  }, [organization?.dashboardSettings?.enabledWidgets]);

  const [selected, setSelected] = useState<Record<DashboardProfileKey, DashboardWidgetKey[]>>(initialWidgets);

  useEffect(() => {
    setSelected(initialWidgets);
  }, [initialWidgets]);

  // Masquer complètement pour les non-super-admins (après les hooks)
  if (!canEdit) return null;

  function toggleWidget(profile: DashboardProfileKey, widget: DashboardWidgetKey) {
    setSelected((current) => {
      const values = current[profile] ?? [];
      return {
        ...current,
        [profile]: values.includes(widget) ? values.filter((item) => item !== widget) : [...values, widget]
      };
    });
  }

  function resetProfile(profile: DashboardProfileKey) {
    setSelected((current) => ({ ...current, [profile]: defaultDashboardWidgetsForProfile(profile) }));
  }

  async function handleSave() {
    if (!organization || !canEdit) return;
    setLoading(true);
    setMessage("");
    await updateOrganizationDashboardSettings(organization.id, { enabledWidgets: selected });
    await refreshSession();
    setMessage("Rubriques du dashboard mises à jour.");
    setLoading(false);
  }

  const activeDefinition = profiles.find((profile) => profile.key === activeProfile);
  const visibleWidgets = DASHBOARD_WIDGETS.filter((widget) => widget.defaultProfiles.includes(activeProfile));

  return (
    <Card className="mt-6 max-w-5xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold">Rubriques du dashboard</p>
          <p className="mt-2 text-sm leading-6 text-sobaya-muted">Activez ou masquez les cartes visibles selon le profil métier. Si aucune configuration n’est enregistrée, SOBAYA utilise les rubriques par défaut.</p>
        </div>
        <Button type="button" disabled={!canEdit || loading} onClick={handleSave}>{loading ? "Enregistrement..." : "Enregistrer les rubriques"}</Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {profiles.map((profile) => (
          <button
            key={profile.key}
            type="button"
            onClick={() => setActiveProfile(profile.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${activeProfile === profile.key ? "border-sobaya-primary bg-sobaya-primary text-white" : "border-sobaya-border bg-white text-sobaya-ink hover:bg-sobaya-soft"}`}
          >
            {profile.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-sobaya-border bg-sobaya-soft/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-medium">{activeDefinition?.label}</p>
            <p className="mt-1 text-sm text-sobaya-muted">{activeDefinition?.help}</p>
          </div>
          <Button type="button" variant="secondary" disabled={!canEdit} onClick={() => resetProfile(activeProfile)}>Réinitialiser ce profil</Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleWidgets.map((widget) => {
          const checked = (selected[activeProfile] ?? []).includes(widget.key);
          return (
            <label key={widget.key} className="flex cursor-pointer gap-3 rounded-2xl border border-sobaya-border bg-white p-4">
              <input
                type="checkbox"
                checked={checked}
                disabled={!canEdit}
                onChange={() => toggleWidget(activeProfile, widget.key)}
                className="mt-1 h-4 w-4 accent-sobaya-primary"
              />
              <span>
                <span className="block font-medium">{widget.label}</span>
                <span className="mt-1 block text-sm leading-5 text-sobaya-muted">{widget.description}</span>
              </span>
            </label>
          );
        })}
      </div>

      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {!canEdit ? <p className="mt-4 text-sm text-amber-700">Votre rôle ne permet pas de modifier les rubriques du dashboard.</p> : null}
    </Card>
  );
}
