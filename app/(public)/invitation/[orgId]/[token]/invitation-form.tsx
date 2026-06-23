"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { submitTenantForm } from "@/services/tenant-invitations";
import type { TenantInvitation } from "@/services/tenant-invitations";

export function InvitationForm({
  invitation,
  orgId
}: {
  invitation: TenantInvitation;
  orgId: string;
}) {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState(invitation.tenantNameHint ?? "");
  const [phone, setPhone] = useState(invitation.tenantPhoneHint ?? "");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profession, setProfession] = useState("");
  const [employer, setEmployer] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !phone.trim()) {
      setError("Le nom complet et le téléphone sont obligatoires.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await submitTenantForm(orgId, invitation.id, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        profession: profession.trim() || undefined,
        employer: employer.trim() || undefined,
        nationalId: nationalId.trim() || undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erreur: ${msg}`);
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sobaya-soft px-5 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 max-w-sm w-full">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
          <h1 className="text-lg font-bold text-sobaya-ink">Dossier envoyé !</h1>
          <p className="mt-2 text-sm text-sobaya-muted">
            Vos informations ont bien été transmises à votre propriétaire.
            Votre dossier sera créé après validation de sa part.
          </p>
          <p className="mt-4 text-sm font-medium text-sobaya-primary">{displayName}</p>
        </div>
        <p className="mt-6 text-xs text-sobaya-muted">Propulsé par sobaya.ci</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sobaya-soft">
      <div className="bg-sobaya-primary px-5 py-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">SOBAYA</p>
        <h1 className="text-xl font-bold text-white">Créez votre dossier locataire</h1>
        <p className="mt-1 text-sm text-white/70">Remplissez ce formulaire pour finaliser votre dossier.</p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          <Clock size={11} />
          Lien valide jusqu&apos;au {new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg px-5 py-8 space-y-5">
        <div className="rounded-2xl border border-sobaya-border bg-white p-5 space-y-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-sobaya-ink">
            <ClipboardList size={15} className="text-sobaya-primary" />
            Informations personnelles
          </p>
          <FormField label="Nom complet" required>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ex : Kouassi Jean" required />
          </FormField>
          <FormField label="Téléphone" required help="Numéro principal pour les rappels et quittances.">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex : 0707070707" required />
          </FormField>
          <FormField label="Email" help="Optionnel.">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex : jean@email.com" />
          </FormField>
          <FormField label="Date de naissance" help="Optionnel.">
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </FormField>
          <FormField label="Profession" help="Optionnel.">
            <Input value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Ex : Comptable" />
          </FormField>
          <FormField label="Employeur" help="Optionnel.">
            <Input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="Ex : Société ABC" />
          </FormField>
          <FormField label="Pièce d&apos;identité" help="Numéro CNI, passeport ou tout autre document.">
            <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="Ex : CNI CI0123456789" />
          </FormField>
        </div>

        <div className="rounded-2xl border border-sobaya-border bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-sobaya-ink">Informations complémentaires</p>
          <FormField label="Adresse actuelle" help="Optionnel.">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex : Cocody Angré, 7e tranche" />
          </FormField>
          <FormField label="Contact d&apos;urgence" help="Optionnel.">
            <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Ex : Koné Mariam" />
          </FormField>
          <FormField label="Téléphone du contact d&apos;urgence" help="Optionnel.">
            <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="Ex : 0505050505" />
          </FormField>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <Button type="submit" className="w-full" disabled={sending}>
          {sending ? "Envoi en cours..." : "Envoyer mon dossier"}
        </Button>

        <p className="text-center text-xs text-sobaya-muted pb-4">
          Informations transmises de manière sécurisée à votre propriétaire uniquement.
          Propulsé par <span className="text-sobaya-primary">sobaya.ci</span>
        </p>
      </form>
    </div>
  );
}
