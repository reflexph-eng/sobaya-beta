"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Copy, Plus, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import {
  approveSubmission,
  createTenantInvitation,
  isInvitationValid,
  listPendingSubmissions,
  listTenantInvitations
} from "@/services/tenant-invitations";
import type { TenantInvitation, TenantSubmission } from "@/services/tenant-invitations";

export function TenantInvitationManager({ onTenantCreated }: { onTenantCreated?: () => void }) {
  const { organization, firebaseUser, profile } = useAuth();
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [submissions, setSubmissions] = useState<TenantSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [newInvitation, setNewInvitation] = useState<TenantInvitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const actor = { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined };

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const [invs, subs] = await Promise.all([
        listTenantInvitations(organization.id),
        listPendingSubmissions(organization.id)
      ]);
      setInvitations(invs);
      setSubmissions(subs);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  function getInvitationUrl(inv: TenantInvitation) {
    const base = typeof window !== "undefined" ? window.location.origin : "https://sobaya.ci";
    return `${base}/invitation/${inv.organizationId}/${inv.id}`;
  }

  async function handleCreate() {
    if (!name.trim() || !phone.trim()) {
      setError("Le nom et le téléphone sont obligatoires.");
      return;
    }
    if (!organization?.id) return;
    setCreating(true);
    setError("");
    try {
      const inv = await createTenantInvitation(organization.id, name, phone, actor);
      setNewInvitation(inv);
      setName("");
      setPhone("");
      setShowForm(false);
      await refresh();
    } catch {
      setError("Impossible de créer l'invitation. Réessayez.");
    } finally {
      setCreating(false);
    }
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handleWhatsApp(inv: TenantInvitation) {
    const url = getInvitationUrl(inv);
    const msg = encodeURIComponent(
      `Bonjour ${inv.tenantNameHint},\n\nJe vous invite à compléter votre dossier locataire SOBAYA en cliquant sur ce lien :\n\n${url}\n\nCe lien est valide 7 jours.\n\nCordialement`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  async function handleApprove(sub: TenantSubmission) {
    if (!organization?.id) return;
    setApproving(sub.id);
    try {
      await approveSubmission(organization.id, sub, actor);
      await refresh();
      onTenantCreated?.();
    } catch {
      setError("Impossible de créer le dossier. Réessayez.");
    } finally {
      setApproving(null);
    }
  }

  const pending = invitations.filter((i) => i.status === "pending" && isInvitationValid(i));
  // Soumissions non encore approuvées
  const pendingSubmissions = submissions.filter((s) => !(s as { approvedTenantId?: string }).approvedTenantId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-sobaya-primary" />
          <p className="font-medium text-sobaya-ink">Invitations locataires</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setNewInvitation(null); }}>
          <Plus size={15} /> Inviter un locataire
        </Button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <Card>
          <p className="mb-4 text-sm font-medium text-sobaya-ink">Nouvelle invitation</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Nom du locataire" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Kouassi Jean" />
            </FormField>
            <FormField label="Téléphone" required>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex : 0707070707" />
            </FormField>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button disabled={creating} onClick={handleCreate}>
              {creating ? "Génération..." : "Générer le lien"}
            </Button>
          </div>
        </Card>
      )}

      {/* Nouveau lien créé */}
      {newInvitation && (
        <Card>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sobaya-ink">Lien créé pour {newInvitation.tenantNameHint}</p>
              <p className="mt-1 text-xs text-sobaya-muted">Valide 7 jours · Usage unique</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={() => handleWhatsApp(newInvitation)}>
                  <Send size={14} /> Envoyer sur WhatsApp
                </Button>
                <Button variant="secondary" onClick={() => handleCopy(getInvitationUrl(newInvitation))}>
                  <Copy size={14} /> {copied ? "Copié !" : "Copier le lien"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dossiers reçus — à valider */}
      {pendingSubmissions.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 size={15} /> {pendingSubmissions.length} dossier(s) reçu(s) — à valider
          </p>
          <div className="space-y-2">
            {pendingSubmissions.map((sub) => (
              <div key={sub.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <p className="font-medium text-sobaya-ink">{sub.displayName}</p>
                  <p className="text-sm text-sobaya-muted">{sub.phone}</p>
                  {sub.profession && <p className="text-xs text-sobaya-muted mt-0.5">{sub.profession}{sub.employer ? ` · ${sub.employer}` : ""}</p>}
                </div>
                <Button disabled={approving === sub.id} onClick={() => handleApprove(sub)}>
                  <UserPlus size={14} /> {approving === sub.id ? "Création..." : "Créer le dossier"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitations en attente */}
      {pending.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-amber-700 flex items-center gap-1.5">
            <Clock size={15} /> {pending.length} invitation(s) en attente de réponse
          </p>
          <div className="space-y-2">
            {pending.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div>
                  <p className="text-sm font-medium text-sobaya-ink">{inv.tenantNameHint}</p>
                  <p className="text-xs text-sobaya-muted">Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleWhatsApp(inv)}>
                    <Send size={13} /> Renvoyer
                  </Button>
                  <Button variant="secondary" onClick={() => handleCopy(getInvitationUrl(inv))}>
                    <Copy size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-sobaya-muted">Chargement...</p>}
      {!loading && invitations.length === 0 && pendingSubmissions.length === 0 && (
        <p className="text-sm text-sobaya-muted text-center py-4">
          Aucune invitation pour l&apos;instant.
        </p>
      )}
    </div>
  );
}
