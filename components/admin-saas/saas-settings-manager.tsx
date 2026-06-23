"use client";

import { useEffect, useState } from "react";
import { Save, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { buildDefaultState, getModulesState, saveModulesState } from "@/services/platform-config";
import { SOBAYA_MODULES } from "@/types/platform-config";
import type { ModulesState } from "@/types/platform-config";

export function SaasSettingsManager() {
  const { firebaseUser } = useAuth();
  const [state, setState] = useState<ModulesState>(buildDefaultState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getModulesState().then(setState).finally(() => setLoading(false));
  }, []);

  function toggle(moduleId: string) {
    const moduleConfig = SOBAYA_MODULES.find((m) => m.id === moduleId);
    if (moduleConfig?.isCoreModule) return; // Les modules socle ne peuvent pas être désactivés
    setState((current) => ({ ...current, [moduleId]: !current[moduleId as keyof ModulesState] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveModulesState(state, firebaseUser?.uid);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const coreModules = SOBAYA_MODULES.filter((m) => m.isCoreModule);
  const optionalModules = SOBAYA_MODULES.filter((m) => !m.isCoreModule);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pilotage des modules"
        description="Activez ou désactivez les modules SOBAYA pour toutes les organisations. Les modules socle ne peuvent pas être désactivés."
      />

      {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}

      {/* Modules socle — toujours actifs */}
      <Card>
        <p className="mb-4 font-medium text-sobaya-ink">Modules socle <span className="ml-2 rounded-full bg-sobaya-soft px-2 py-0.5 text-xs text-sobaya-muted">Toujours actifs</span></p>
        <div className="grid gap-3 sm:grid-cols-2">
          {coreModules.map((module) => (
            <div key={module.id} className="flex items-center justify-between rounded-xl border border-sobaya-border p-3">
              <div>
                <p className="text-sm font-medium text-sobaya-ink">{module.label}</p>
                <p className="text-xs text-sobaya-muted">{module.description}</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ToggleRight size={20} className="text-emerald-500" /> Actif
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Modules optionnels — pilotables */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-medium text-sobaya-ink">Modules optionnels</p>
          <div className="flex items-center gap-3">
            {saved ? <p className="text-sm text-emerald-600">Enregistré ✓</p> : null}
            <Button disabled={saving || loading} onClick={handleSave}>
              <Save size={15} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {optionalModules.map((module) => {
            const enabled = state[module.id] ?? module.defaultEnabled;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => toggle(module.id)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${enabled ? "border-emerald-200 bg-emerald-50" : "border-sobaya-border bg-white hover:bg-sobaya-soft"}`}
              >
                <div>
                  <p className={`text-sm font-medium ${enabled ? "text-emerald-800" : "text-sobaya-muted"}`}>{module.label}</p>
                  <p className="text-xs text-sobaya-muted">{module.description}</p>
                </div>
                {enabled
                  ? <ToggleRight size={22} className="shrink-0 text-emerald-500" />
                  : <ToggleLeft size={22} className="shrink-0 text-sobaya-muted" />
                }
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-sobaya-muted">
          Les modifications s&apos;appliquent immédiatement après enregistrement pour toutes les organisations.
          Un module désactivé disparaît du menu de navigation mais ses données sont conservées.
        </p>
      </Card>
    </div>
  );
}
