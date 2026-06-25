"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getAboutContent } from "@/services/about";
import { DEFAULT_ABOUT_CONTENT } from "@/types/about";
import type { AboutContent } from "@/types/about";

function StatCard({ value, label, fallback }: { value?: string; label: string; fallback: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-sobaya-primary">{value && value.trim() ? value : fallback}</p>
      <p className="mt-1 text-sm text-sobaya-muted">{label}</p>
    </div>
  );
}

export function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);

  useEffect(() => {
    getAboutContent().then(setContent).catch(() => {});
  }, []);

  const activeTestimonials = content.testimonials.filter((t) => t.actif);

  return (
    <div className="w-full">

      {/* ── SECTION 1 : HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-sobaya-primary">
        <div className="mx-auto max-w-screen-xl px-5 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80">
                {content.heroTagline}
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
                La plateforme immobilière<br />conçue pour<br />
                <span className="text-white/70">la Côte d&apos;Ivoire.</span>
              </h1>
              <p className="mt-5 text-lg text-white/70 leading-relaxed">
                SOBAYA n&apos;est pas une adaptation d&apos;un outil étranger.
                C&apos;est une solution pensée ici, pour nos réalités,
                notre Mobile Money, nos propriétaires.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-sobaya-primary hover:bg-sobaya-soft transition">
                  Créer mon espace gratuit
                </Link>
                <Link href="#histoire" className="rounded-xl border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition">
                  Notre histoire ↓
                </Link>
              </div>
            </div>
            <div className="relative">
              <Image
                src={content.heroImage}
                alt="SOBAYA plateforme"
                className="w-full rounded-2xl object-cover shadow-xl"
                width={800}
                height={400}
                style={{ maxHeight: "400px" }}
              />
            </div>
          </div>
        </div>
        {/* Vague de transition */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* ── SECTION 2 : STATS ────────────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-screen-xl px-5">
          <div className="grid grid-cols-3 divide-x divide-sobaya-border rounded-2xl border border-sobaya-border py-8">
            <StatCard value={content.statBiens}          label="Biens gérés"           fallback="En croissance" />
            <StatCard value={content.statOrganisations}  label="Organisations inscrites" fallback="Rejoignez-nous" />
            <StatCard value={content.statAnnonces}       label="Annonces publiées"      fallback="Marketplace active" />
          </div>
        </div>
      </section>

      {/* ── SECTION 3 : L'HISTOIRE (STORYTELLING) ───────────────────────── */}
      <section id="histoire" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-screen-xl px-5">
          <div className="grid gap-14 md:grid-cols-2 md:items-center">
            <div>
              <Image
                src={content.fondateurPhoto}
                alt={content.fondateurNom}
                className="w-full max-w-sm rounded-2xl object-cover shadow-lg mx-auto"
                width={400}
                height={400}
              />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-sobaya-primary">Notre histoire</span>
              <h2 className="mt-3 text-3xl font-bold text-sobaya-ink leading-tight">
                Ce soir-là,<br />
                <span className="text-sobaya-primary">j&apos;en ai eu assez.</span>
              </h2>
              <div className="mt-5 space-y-4 text-sobaya-muted leading-relaxed">
                <p>
                  Je rentrais du bureau, fatigué. Un message WhatsApp de mon locataire :
                  <em className="text-sobaya-ink"> « M. Touré, j&apos;ai payé ce matin. Mon reçu ? »</em>
                </p>
                <p>
                  Pour lui donner ce reçu, je devais retourner au bureau.
                  Carnet. Stylo. Signature. Il était 20h. J&apos;ai oublié.
                  Trois jours plus tard, il relançait.
                </p>
                <p>
                  J&apos;ai compris ce soir-là que ce n&apos;était pas un problème de bonne volonté.
                  C&apos;était un problème d&apos;outil. Personne n&apos;avait construit quelque chose pour nous,
                  ici, avec notre Mobile Money, notre réalité.
                </p>
                <p className="font-semibold text-sobaya-ink">
                  Alors j&apos;ai décidé de le construire moi-même.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-sobaya-primary">
                  <Image src={content.fondateurPhoto} alt={content.fondateurNom} className="h-full w-full object-cover" width={48} height={48} />
                </div>
                <div>
                  <p className="font-semibold text-sobaya-ink">{content.fondateurNom}</p>
                  <p className="text-sm text-sobaya-muted">{content.fondateurTitre}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 : MISSION ──────────────────────────────────────────── */}
      <section className="bg-sobaya-soft py-16 md:py-24">
        <div className="mx-auto max-w-screen-xl px-5">
          <div className="grid gap-14 md:grid-cols-2 md:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-sobaya-primary">Notre mission</span>
              <h2 className="mt-3 text-3xl font-bold text-sobaya-ink leading-tight">
                Donner à chaque propriétaire africain<br />les outils des grands.
              </h2>
              <p className="mt-5 text-sobaya-muted leading-relaxed">
                Les grandes agences immobilières ont des équipes, des logiciels, des comptables.
                Le propriétaire ivoirien qui loue 3 appartements gère tout seul, depuis son téléphone,
                entre deux réunions.
              </p>
              <p className="mt-3 text-sobaya-muted leading-relaxed">
                SOBAYA nivelle ce terrain. Quittances automatiques, suivi des paiements,
                marketplace publique, vitrine numérique avec QR Code — tout ce dont vous avez besoin,
                dans une application simple, accessible depuis votre téléphone.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { emoji: "🏘️", label: "Propriétaires particuliers" },
                  { emoji: "🤝", label: "Agents indépendants" },
                  { emoji: "🏢", label: "Agences immobilières" },
                  { emoji: "🌍", label: "Afrique francophone" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-sobaya-border bg-white p-3">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-sm font-medium text-sobaya-ink">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Image
                src={content.missionImage}
                alt="Abidjan Côte d&apos;Ivoire"
                className="w-full rounded-2xl object-cover shadow-lg"
                width={800}
                height={420}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 : TÉMOIGNAGES ──────────────────────────────────────── */}
      {activeTestimonials.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-screen-xl px-5">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-sobaya-primary">Ils nous font confiance</span>
              <h2 className="mt-3 text-3xl font-bold text-sobaya-ink">Ce qu&apos;ils en disent</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {activeTestimonials.map((t) => (
                <div key={t.id} className="rounded-2xl border border-sobaya-border bg-sobaya-soft p-6">
                  <p className="text-sobaya-muted leading-relaxed italic">« {t.texte} »</p>
                  <div className="mt-5 flex items-center gap-3">
                    <Image src={t.photo} alt={t.nom} className="h-11 w-11 rounded-full object-cover border-2 border-sobaya-primary" width={44} height={44} />
                    <div>
                      <p className="font-semibold text-sobaya-ink text-sm">{t.nom}</p>
                      <p className="text-xs text-sobaya-muted">{t.titre}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 6 : CTA FINAL ────────────────────────────────────────── */}
      <section className="bg-sobaya-primary py-16 md:py-24">
        <div className="mx-auto max-w-screen-xl px-5 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Prêt à transformer<br />votre gestion immobilière ?
          </h2>
          <p className="mt-4 text-white/70 text-lg max-w-xl mx-auto">
            Rejoignez SOBAYA dès aujourd&apos;hui. Accès gratuit pour démarrer.
            Aucune carte de crédit requise.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register" className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-sobaya-primary hover:bg-sobaya-soft transition shadow-lg">
              Créer mon espace gratuitement
            </Link>
            <Link href="/contact" className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-medium text-white hover:bg-white/10 transition">
              Nous contacter
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">sobaya.ci · Cabinet Grain de Sel · Port-Bouët, Abidjan</p>
        </div>
      </section>

    </div>
  );
}
