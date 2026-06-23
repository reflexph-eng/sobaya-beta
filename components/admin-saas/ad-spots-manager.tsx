"use client";

import { useEffect, useState } from "react";
import { Image, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { getAdSpotsMap, saveAdSpot } from "@/services/ad-spots";
import { AD_SPOT_LABELS, AD_SPOT_DIMENSIONS } from "@/types/ad-spot";
import type { AdSpot, AdSpotSlot } from "@/types/ad-spot";

const ALL_SLOTS: AdSpotSlot[] = ["banner_top", "sidebar_left_1", "sidebar_left_2", "sidebar_right"];

const emptyForm = { imageUrl: "", targetUrl: "", altText: "", isActive: false };

export function AdSpotsManager() {
  const { firebaseUser } = useAuth();
  const [spots, setSpots] = useState<Partial<Record<AdSpotSlot, AdSpot>>>({});
  const [forms, setForms] = useState<Record<AdSpotSlot, typeof emptyForm>>({
    banner_top: { ...emptyForm },
    sidebar_left_1: { ...emptyForm },
    sidebar_left_2: { ...emptyForm },
    sidebar_right: { ...emptyForm }
  });
  const [saving, setSaving] = useState<AdSpotSlot | null>(null);
  const [saved, setSaved] = useState<AdSpotSlot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdSpotsMap().then((map) => {
      setSpots(map);
      setForms((current) => {
        const next = { ...current };
        for (const slot of ALL_SLOTS) {
          const spot = map[slot];
          if (spot) {
            next[slot] = { imageUrl: spot.imageUrl, targetUrl: spot.targetUrl, altText: spot.altText, isActive: spot.isActive };
          }
        }
        return next;
      });
    });
  }, []);

  function updateForm(slot: AdSpotSlot, field: keyof typeof emptyForm, value: string | boolean) {
    setForms((current) => ({ ...current, [slot]: { ...current[slot], [field]: value } }));
  }

  async function handleSave(slot: AdSpotSlot) {
    const values = forms[slot];
    if (values.isActive && !values.imageUrl.trim()) {
      setError("Renseignez l'URL de l'image avant d'activer cet emplacement.");
      return;
    }
    setSaving(slot);
    setError("");
    try {
      await saveAdSpot(slot, values, firebaseUser?.uid);
      setSaved(slot);
      setTimeout(() => setSaved(null), 3000);
    } catch {
      setError("Enregistrement impossible. Vérifiez vos permissions super admin.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Espaces publicitaires" description="Gérez les bannières et encarts publicitaires affichés sur la page d'accueil de la marketplace." />

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="rounded-2xl border border-sobaya-border bg-sobaya-soft p-4 text-sm">
        <p className="font-medium text-sobaya-ink">📁 Images disponibles dans le projet</p>
        <p className="mt-1 text-sobaya-muted">Dépose tes images dans le dossier <code className="rounded bg-white px-1 py-0.5 text-xs">public/ads/</code> du projet, puis utilise l&apos;URL correspondante ci-dessous.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { file: "/ads/banner-top.svg", label: "Bannière haute (placeholder)" },
            { file: "/ads/sidebar-left-1.svg", label: "Colonne gauche 1 (placeholder)" },
            { file: "/ads/sidebar-left-2.svg", label: "Colonne gauche 2 (placeholder)" },
            { file: "/ads/sidebar-right.svg", label: "Colonne droite (placeholder)" }
          ].map((item) => (
            <div key={item.file} className="flex items-center justify-between rounded-lg border border-sobaya-border bg-white px-3 py-2">
              <span className="text-xs text-sobaya-muted">{item.label}</span>
              <code className="ml-2 shrink-0 rounded bg-sobaya-soft px-1.5 py-0.5 text-[11px] text-sobaya-ink">{item.file}</code>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-sobaya-muted">Pour ajouter une vraie image : remplace le fichier <code className="rounded bg-white px-1 py-0.5 text-[10px]">.svg</code> par ton <code className="rounded bg-white px-1 py-0.5 text-[10px]">.jpg</code> ou <code className="rounded bg-white px-1 py-0.5 text-[10px]">.png</code> dans le même dossier, puis redéploie.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {ALL_SLOTS.map((slot) => (
          <Card key={slot}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sobaya-ink flex items-center gap-2"><Image size={16} /> {AD_SPOT_LABELS[slot]}</p>
                <p className="mt-1 text-xs text-sobaya-muted">{AD_SPOT_DIMENSIONS[slot]}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-sobaya-border"
                  checked={forms[slot].isActive}
                  onChange={(event) => updateForm(slot, "isActive", event.target.checked)}
                />
                Actif
              </label>
            </div>

            {forms[slot].imageUrl ? (
              <div className="mb-3 overflow-hidden rounded-lg border border-sobaya-border">
                <img src={forms[slot].imageUrl} alt="Aperçu" className="max-h-32 w-full object-contain bg-gray-50" />
              </div>
            ) : null}

            <div className="space-y-3">
              <FormField label="URL de l'image" help="Fichier local : /ads/mon-image.jpg — ou URL externe https://...">
                <Input placeholder="/ads/banner-top.jpg" value={forms[slot].imageUrl} onChange={(event) => updateForm(slot, "imageUrl", event.target.value)} />
              </FormField>
              <FormField label="Lien de destination" help="Page vers laquelle le visiteur est redirigé au clic.">
                <Input placeholder="https://..." value={forms[slot].targetUrl} onChange={(event) => updateForm(slot, "targetUrl", event.target.value)} />
              </FormField>
              <FormField label="Texte alternatif" help="Décrit l'annonce pour l'accessibilité.">
                <Input placeholder="Annonce publicitaire" value={forms[slot].altText} onChange={(event) => updateForm(slot, "altText", event.target.value)} />
              </FormField>
              <div className="flex items-center justify-between">
                {saved === slot ? <p className="text-sm text-emerald-600">Enregistré ✓</p> : <span />}
                <Button disabled={saving === slot} onClick={() => handleSave(slot)}>
                  <Save size={16} /> {saving === slot ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
