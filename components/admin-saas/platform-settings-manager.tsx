"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Globe, MessageSquare, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { getPlatformSettings, savePlatformSettings, PLATFORM_DEFAULTS } from "@/services/platform-settings";
import type { PlatformSettings } from "@/services/platform-settings";
import { useAuth } from "@/components/providers/auth-provider";

export function PlatformSettingsManager() {
  const { firebaseUser } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings>(PLATFORM_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getPlatformSettings();
      setSettings(s);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(key: keyof PlatformSettings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(null);
  }

  async function handleSave(section: string) {
    setSaving(true);
    try {
      await savePlatformSettings(settings, firebaseUser?.uid);
      setSaved(section);
      setTimeout(() => setSaved(null), 3000);
    } finally { setSaving(false); }
  }

  if (loading) return <div className="py-20 text-center text-sm text-sobaya-muted">Chargement...</div>;

  return (
    <SuperAdminGate require="canAccessAdmin">
      <div className="space-y-8">
        <PageHeader
          title="Paramètres de la plateforme"
          description="Modifiez les textes, coordonnées et messages visibles sur la plateforme sans toucher au code."
        />

        {/* ── Coordonnées publiques ───────────────────────────────────── */}
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sobaya-soft">
              <Building2 size={17} className="text-sobaya-primary" />
            </div>
            <div>
              <p className="font-semibold text-sobaya-ink">Coordonnées publiques</p>
              <p className="text-xs text-sobaya-muted">Affichées sur la page Contact et le footer</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nom de la société">
              <Input value={settings.contactCompanyName ?? ""} onChange={e => update("contactCompanyName", e.target.value)} placeholder={PLATFORM_DEFAULTS.contactCompanyName} />
            </FormField>
            <FormField label="Email de contact">
              <Input type="email" value={settings.contactEmail ?? ""} onChange={e => update("contactEmail", e.target.value)} placeholder={PLATFORM_DEFAULTS.contactEmail} />
            </FormField>
            <FormField label="Numéro WhatsApp" help="Format international sans + ni espaces. Ex : 2250708123456">
              <Input value={settings.contactWhatsapp ?? ""} onChange={e => update("contactWhatsapp", e.target.value)} placeholder={PLATFORM_DEFAULTS.contactWhatsapp} />
            </FormField>
            <FormField label="Adresse physique">
              <Input value={settings.contactAddress ?? ""} onChange={e => update("contactAddress", e.target.value)} placeholder={PLATFORM_DEFAULTS.contactAddress} />
            </FormField>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            {saved === "coordonnees" && <span className="text-sm text-emerald-600">✓ Enregistré</span>}
            <Button onClick={() => handleSave("coordonnees")} disabled={saving}>Enregistrer</Button>
          </div>
        </Card>

        {/* ── Textes marketing ────────────────────────────────────────── */}
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sobaya-soft">
              <Megaphone size={17} className="text-sobaya-primary" />
            </div>
            <div>
              <p className="font-semibold text-sobaya-ink">Textes marketing</p>
              <p className="text-xs text-sobaya-muted">Visibles sur la page d&apos;accueil et le header</p>
            </div>
          </div>
          <div className="space-y-4">
            <FormField label="Slogan (header + page login)" help="Ex : Votre patrimoine. Sous contrôle.">
              <Input value={settings.headerSlogan ?? ""} onChange={e => update("headerSlogan", e.target.value)} placeholder={PLATFORM_DEFAULTS.headerSlogan} />
            </FormField>
            <FormField label="Titre principal (hero marketplace)">
              <Input value={settings.heroTitle ?? ""} onChange={e => update("heroTitle", e.target.value)} placeholder={PLATFORM_DEFAULTS.heroTitle} />
            </FormField>
            <FormField label="Sous-titre (hero marketplace)">
              <Input value={settings.heroSubtitle ?? ""} onChange={e => update("heroSubtitle", e.target.value)} placeholder={PLATFORM_DEFAULTS.heroSubtitle} />
            </FormField>
            <FormField label="Titre CTA propriétaire">
              <Input value={settings.ctaTitle ?? ""} onChange={e => update("ctaTitle", e.target.value)} placeholder={PLATFORM_DEFAULTS.ctaTitle} />
            </FormField>
            <FormField label="Sous-titre CTA propriétaire">
              <Input value={settings.ctaSubtitle ?? ""} onChange={e => update("ctaSubtitle", e.target.value)} placeholder={PLATFORM_DEFAULTS.ctaSubtitle} />
            </FormField>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            {saved === "marketing" && <span className="text-sm text-emerald-600">✓ Enregistré</span>}
            <Button onClick={() => handleSave("marketing")} disabled={saving}>Enregistrer</Button>
          </div>
        </Card>

        {/* ── Template relance locataire ───────────────────────────────── */}
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sobaya-soft">
              <MessageSquare size={17} className="text-sobaya-primary" />
            </div>
            <div>
              <p className="font-semibold text-sobaya-ink">Message de relance locataire</p>
              <p className="text-xs text-sobaya-muted">Envoyé via WhatsApp pour les impayés</p>
            </div>
          </div>
          <FormField
            label="Template du message"
            help="Variables disponibles : {nom} {mois_count} {mois_liste} {montant}"
          >
            <textarea
              value={settings.arrearsMessageTemplate ?? ""}
              onChange={e => update("arrearsMessageTemplate", e.target.value)}
              placeholder={PLATFORM_DEFAULTS.arrearsMessageTemplate}
              rows={4}
              className="w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm text-sobaya-ink outline-none transition focus:border-sobaya-primary focus:ring-1 focus:ring-sobaya-primary resize-none"
            />
          </FormField>
          <div className="mt-2 rounded-xl bg-sobaya-soft p-3 text-xs text-sobaya-muted">
            <p className="font-medium mb-1">Aperçu avec exemple :</p>
            <p>{(settings.arrearsMessageTemplate ?? PLATFORM_DEFAULTS.arrearsMessageTemplate)
              .replace("{nom}", "Kouassi Jean")
              .replace("{mois_count}", "2")
              .replace("{mois_liste}", "janvier 2026, février 2026")
              .replace("{montant}", "160 000 F CFA")
            }</p>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            {saved === "relance" && <span className="text-sm text-emerald-600">✓ Enregistré</span>}
            <Button onClick={() => handleSave("relance")} disabled={saving}>Enregistrer</Button>
          </div>
        </Card>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">💡 Les modifications sont effectives immédiatement</p>
          <p className="mt-1">Après enregistrement, les visiteurs verront les nouveaux textes dès leur prochain chargement de page. Aucun redéploiement nécessaire.</p>
        </div>
      </div>
    </SuperAdminGate>
  );
}
