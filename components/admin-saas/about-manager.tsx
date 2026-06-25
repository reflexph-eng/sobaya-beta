"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Save, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { getAboutContent, saveAboutContent } from "@/services/about";
import { DEFAULT_ABOUT_CONTENT } from "@/types/about";
import type { AboutContent } from "@/types/about";

export function AboutManager() {
  const { firebaseUser } = useAuth();
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAboutContent().then(setContent).finally(() => setLoading(false));
  }, []);

  function update(key: keyof AboutContent, value: string) {
    setContent((c) => ({ ...c, [key]: value }));
  }

  function updateTestimonial(id: string, field: string, value: string | boolean) {
    setContent((c) => ({
      ...c,
      testimonials: c.testimonials.map((t) => t.id === id ? { ...t, [field]: value } : t)
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveAboutContent(content, firebaseUser?.uid);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const photoFields: Array<{ key: keyof AboutContent; label: string; help: string }> = [
    { key: "heroImage",      label: "Photo héro",         help: "1200×600 px — /about/hero.jpg" },
    { key: "fondateurPhoto", label: "Photo fondateur",    help: "400×400 px — /about/fondateur.jpg" },
    { key: "missionImage",   label: "Photo mission",      help: "1200×500 px — /about/abidjan.jpg" },
  ];

  if (loading) return <p className="text-sm text-sobaya-muted">Chargement...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Page À propos" description="Gérez le contenu et les photos de la page de présentation publique." />

      {/* Photos */}
      <Card>
        <p className="mb-4 flex items-center gap-2 font-medium text-sobaya-ink"><ImageIcon size={16} /> Photos</p>
        <div className="rounded-xl border border-sobaya-border bg-sobaya-soft p-4 mb-4 text-sm text-sobaya-muted">
          Dépose tes images dans <code className="bg-white rounded px-1">public/about/</code>, puis saisis le chemin ici.
          Exemple : <code className="bg-white rounded px-1">/about/fondateur.jpg</code>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {photoFields.map((f) => (
            <div key={f.key}>
              {(content[f.key] as string) && (
                <NextImage src={(content[f.key] as string) || "/about/hero.svg"} alt={f.label} className="mb-2 h-24 w-full rounded-xl object-cover border border-sobaya-border" width={300} height={96} />
              )}
              <FormField label={f.label} help={f.help} key={f.key}>
                <Input value={(content[f.key] as string) ?? ""} onChange={(e) => update(f.key, e.target.value)} />
              </FormField>
            </div>
          ))}
        </div>
      </Card>

      {/* Textes fondateur */}
      <Card>
        <p className="mb-4 font-medium text-sobaya-ink">Section Fondateur</p>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Nom complet">
            <Input value={content.fondateurNom} onChange={(e) => update("fondateurNom", e.target.value)} />
          </FormField>
          <FormField label="Titre / Fonction">
            <Input value={content.fondateurTitre} onChange={(e) => update("fondateurTitre", e.target.value)} />
          </FormField>
        </div>
        <FormField label="Biographie courte" help="Apparaît sous la photo fondateur." className="mt-4">
          <textarea
            className="min-h-20 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary"
            value={content.fondateurBio}
            onChange={(e) => update("fondateurBio", e.target.value)}
          />
        </FormField>
        <FormField label="Tagline héro" help="Petite accroche sous le logo en haut de la page." className="mt-4">
          <Input value={content.heroTagline} onChange={(e) => update("heroTagline", e.target.value)} />
        </FormField>
      </Card>

      {/* Stats */}
      <Card>
        <p className="mb-4 font-medium text-sobaya-ink">Chiffres clés</p>
        <p className="mb-4 text-sm text-sobaya-muted">Laissez vide pour afficher un message d&apos;invitation à rejoindre SOBAYA.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Biens gérés" help="Ex: 500+">
            <Input value={content.statBiens ?? ""} onChange={(e) => update("statBiens", e.target.value)} placeholder="Ex: 500+" />
          </FormField>
          <FormField label="Organisations" help="Ex: 120">
            <Input value={content.statOrganisations ?? ""} onChange={(e) => update("statOrganisations", e.target.value)} placeholder="Ex: 120" />
          </FormField>
          <FormField label="Annonces publiées" help="Ex: 350">
            <Input value={content.statAnnonces ?? ""} onChange={(e) => update("statAnnonces", e.target.value)} placeholder="Ex: 350" />
          </FormField>
        </div>
      </Card>

      {/* Témoignages */}
      <Card>
        <p className="mb-4 font-medium text-sobaya-ink">Témoignages</p>
        <p className="mb-4 text-sm text-sobaya-muted">Activez uniquement les témoignages avec une vraie photo et un vrai texte.</p>
        <div className="space-y-4">
          {content.testimonials.map((t) => (
            <div key={t.id} className="rounded-xl border border-sobaya-border p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-sobaya-ink">{t.nom || `Témoignage ${t.id}`}</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={t.actif}
                    onChange={(e) => updateTestimonial(t.id, "actif", e.target.checked)}
                    className="h-4 w-4 rounded border-sobaya-border accent-sobaya-primary"
                  />
                  Activer
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Nom">
                  <Input value={t.nom} onChange={(e) => updateTestimonial(t.id, "nom", e.target.value)} />
                </FormField>
                <FormField label="Titre / Ville">
                  <Input value={t.titre} onChange={(e) => updateTestimonial(t.id, "titre", e.target.value)} />
                </FormField>
                <FormField label="Photo" help="/about/testimonial-1.jpg">
                  <Input value={t.photo} onChange={(e) => updateTestimonial(t.id, "photo", e.target.value)} />
                </FormField>
                <FormField label="Citation">
                  <Input value={t.texte} onChange={(e) => updateTestimonial(t.id, "texte", e.target.value)} />
                </FormField>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sauvegarde */}
      <div className="flex items-center justify-end gap-3">
        {saved && <p className="text-sm text-emerald-600">Enregistré ✓</p>}
        <Button disabled={saving} onClick={handleSave}>
          <Save size={15} /> {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
