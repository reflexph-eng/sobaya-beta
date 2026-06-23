"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Copy, Link2, Plus, Send, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import {
  approveInvitation,
  createTenantInvitation,
  isInvitationValid,
  listTenantInvitations
} from "@/services/tenant-invitations";
import type { TenantInvitation } from "@/types/tenant-invitation";

const STATUS_LABELS = {
  pending: "En attente",
  completed: "Dossier reçu",
  expired: "Traitée / Expirée"
};

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expired: "bg-gray-100 text-gray-500 border-gray-200"
};

export function TenantInvitationManager({ onTenantCreated }: { onTenantCreated?: () => void }) {
  const { organization, firebaseUser, profile } = useAuth();
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
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
    try { setInvitations(await listTenantInvitations(organization.id)); }
    finally { setLoading(false); }
  }, [organization?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  function getInvitationUrl(inv: TenantInvitation) {
    const base = typeof window !== "undefined" ? window.location.origin : "https://sobaya.ci";
    // L'URL utilise l'ID du document Firestore (inv.id), pas le token aléatoire.
    // La page lit le doc directement par getDoc(orgId, invId) — simple et fiable.
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
      `Bonjour ${inv.tenantNameHint},\n\nJe vous invite à compléter votre dossier locataire SOBAYA en cliquant sur le lien ci-dessous :\n\n${url}\n\nCe lien est valide 7 jours.\n\nCordialement`
    );
    window.open(`https://wa.me/${inv.tenantPhoneHint.replace(/\D/g, "")}?text=${msg}`, "_blank");
  }

  async function handleApprove(inv: TenantInvitation) {
    if (!organization?.id) return;
    setApproving(inv.id);
    try {
      await approveInvitation(organization.id, inv, actor);
      await refresh();
      onTenantCreated?.();
    } catch {
      setError("Impossible de créer le dossier. Réessayez.");
    } finally {
      setApproving(null);
    }
  }

  const pending = invitations.filter((i) => i.status === "pending" && isInvitationValid(i));
  const completed = invitations.filter((i) => i.status === "completed");
  const others = invitations.filter((i) => i.status === "expired" || (i.status === "pending" && !isInvitationValid(i)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-sobaya-primary" />
          <p className="font-medium text-sobaya-ink">Invitations locataires</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setNewInvitation(null); }}>
          <Plus size={15} /> Inviter un locataire
        </Button>
      </div>

      {/* Formulaire de création */}
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
              <Link2 size={15} /> {creating ? "Génération..." : "Générer le lien"}
            </Button>
          </div>
        </Card>
      )}

      {/* Lien nouvellement créé */}
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
      {completed.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 size={15} /> {completed.length} dossier(s) reçu(s) — à valider
          </p>
          <div className="space-y-2">
            {completed.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <p className="font-medium text-sobaya-ink">{inv.submittedData?.displayName || inv.tenantNameHint}</p>
                  <p className="text-sm text-sobaya-muted">{inv.submittedData?.phone} · Reçu le {inv.completedAt ? new Date(inv.completedAt).toLocaleDateString("fr-FR") : "—"}</p>
                  {inv.submittedData?.profession && (
                    <p className="text-xs text-sobaya-muted mt-0.5">{inv.submittedData.profession}{inv.submittedData.employer ? ` · ${inv.submittedData.employer}` : ""}</p>
                  )}
                </div>
                <Button disabled={approving === inv.id} onClick={() => handleApprove(inv)}>
                  <UserPlus size={14} /> {approving === inv.id ? "Création..." : "Créer le dossier"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* En attente */}
      {pending.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-amber-700 flex items-center gap-1.5">
            <Clock size={15} /> {pending.length} invitation(s) en attente
          </p>
          <div className="space-y-2">
            {pending.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div>
                  <p className="text-sm font-medium text-sobaya-ink">{inv.tenantNameHint}</p>
                  <p className="text-xs text-sobaya-muted">{inv.tenantPhoneHint} · Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}</p>
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
      {!loading && invitations.length === 0 && (
        <p className="text-sm text-sobaya-muted text-center py-4">
          Aucune invitation pour l&apos;instant. Cliquez sur &ldquo;Inviter un locataire&rdquo; pour commencer.
        </p>
      )}
    </div>
  );
}
