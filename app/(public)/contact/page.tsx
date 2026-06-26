"use client";

import { usePlatformSettings, PLATFORM_DEFAULTS } from "@/services/platform-settings";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const SUBJECTS = [
  "Je cherche un logement",
  "Je veux publier mes annonces",
  "Je veux m'inscrire sur SOBAYA",
  "J&apos;ai une question sur la plateforme",
  "Je souhaite un partenariat",
  "Autre",
];

export default function ContactPage() {
  const { settings } = usePlatformSettings();
  const psWhatsapp = settings.contactWhatsapp || PLATFORM_DEFAULTS.contactWhatsapp;
  const psEmail = settings.contactEmail || PLATFORM_DEFAULTS.contactEmail;
  const psAddress = settings.contactAddress || PLATFORM_DEFAULTS.contactAddress;
  const psCompany = settings.contactCompanyName || PLATFORM_DEFAULTS.contactCompanyName;
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !message.trim()) {
      setError("Indiquez votre nom et votre message.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await addDoc(collection(db, "contactRequests"), {
        nom: nom.trim(),
        email: email.trim() || null,
        telephone: telephone.trim() || null,
        sujet: sujet || "Non précisé",
        message: message.trim(),
        source: "contact-page",
        status: "new",
        createdAt: serverTimestamp()
      });
      setSent(true);
    } catch {
      setError("Envoi impossible. Réessayez ou contactez-nous directement par WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header import dynamique depuis layout */}
      <div className="bg-sobaya-primary py-16">
        <div className="mx-auto max-w-screen-xl px-5 text-center">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-4">
            Disponible 6j/7
          </span>
          <h1 className="text-4xl font-bold text-white md:text-5xl">Nous contacter</h1>
          <p className="mt-4 text-white/70 text-lg max-w-xl mx-auto">
            Une question, un projet, une collaboration ? Nous vous répondons dans les 24 heures.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-5 py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_1.6fr] md:items-start">

          {/* Infos contact */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-sobaya-border p-6">
              <p className="font-semibold text-sobaya-ink mb-4">{psCompany}</p>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-sobaya-primary" />
                  <div>
                    <p className="font-medium text-sobaya-ink">Adresse</p>
                    <p className="text-sobaya-muted mt-0.5">{psAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={18} className="mt-0.5 shrink-0 text-sobaya-primary" />
                  <div>
                    <p className="font-medium text-sobaya-ink">Email</p>
                    <a href={`mailto:${psEmail}`} className="text-sobaya-primary hover:underline mt-0.5 block">{psEmail}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle size={18} className="mt-0.5 shrink-0 text-sobaya-primary" />
                  <div>
                    <p className="font-medium text-sobaya-ink">WhatsApp</p>
                    <a href={`https://wa.me/${psWhatsapp}`} target="_blank" rel="noreferrer" className="text-sobaya-primary hover:underline mt-0.5 block">
                      Écrire sur WhatsApp →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-sobaya-soft p-6">
              <p className="font-semibold text-sobaya-ink mb-3">Vous cherchez un logement ?</p>
              <p className="text-sm text-sobaya-muted mb-4">Consultez directement nos annonces sur la marketplace SOBAYA.</p>
              <a href="/" className="inline-block rounded-xl bg-sobaya-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-sobaya-primaryDark transition">
                Voir les annonces →
              </a>
            </div>

            <div className="rounded-2xl border border-sobaya-border p-6">
              <p className="font-semibold text-sobaya-ink mb-3">Vous êtes propriétaire ou agent ?</p>
              <p className="text-sm text-sobaya-muted mb-4">Créez votre espace SOBAYA gratuitement en 2 minutes.</p>
              <a href="/register" className="inline-block rounded-xl border border-sobaya-primary px-5 py-2.5 text-sm font-semibold text-sobaya-primary hover:bg-sobaya-soft transition">
                Démarrer gratuitement →
              </a>
            </div>
          </div>

          {/* Formulaire */}
          <div className="rounded-2xl border border-sobaya-border p-6 md:p-8">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <p className="text-xl font-bold text-sobaya-ink">Message envoyé !</p>
                <p className="text-sobaya-muted max-w-sm">
                  Nous avons bien reçu votre message et vous répondrons dans les 24 heures.
                </p>
                <button type="button" onClick={() => { setSent(false); setNom(""); setEmail(""); setTelephone(""); setSujet(""); setMessage(""); }} className="text-sm font-medium text-sobaya-primary underline underline-offset-2 mt-2">
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-lg font-semibold text-sobaya-ink mb-6">Votre message</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Nom complet" required>
                    <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" required />
                  </FormField>
                  <FormField label="Téléphone" help="Optionnel">
                    <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+225 XX XX XX XX" />
                  </FormField>
                </div>
                <FormField label="Email" help="Optionnel si vous indiquez un téléphone">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
                </FormField>
                <SelectField label="Objet de votre message" value={sujet} onChange={setSujet}>
                  <option value="">Choisir un objet...</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectField>
                <FormField label="Votre message" required>
                  <textarea
                    className="min-h-32 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Décrivez votre demande..."
                    required
                  />
                </FormField>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
                <p className="text-center text-xs text-sobaya-muted">
                  Ou écrivez-nous directement sur{" "}
                  <a href={`https://wa.me/${psWhatsapp}`} target="_blank" rel="noreferrer" className="text-sobaya-primary underline">WhatsApp</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
