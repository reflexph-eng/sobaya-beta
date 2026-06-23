"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Plus, Trash2 } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { TrustBadge } from "@/components/ui/trust-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { grantBadge, isBadgeActive, listBadgesForOrganization, revokeBadge } from "@/services/badges";
import { BADGE_LABELS, BADGE_TARGET_FOR_TYPE } from "@/types/badge";
import type { Badge, BadgeType } from "@/types/badge";
import type { Organization } from "@/types/organization";

const ALL_BADGE_TYPES = Object.keys(BADGE_LABELS) as BadgeType[];

const TARGET_PLACEHOLDER: Record<string, string> = {
  user: "ID utilisateur (uid Firebase)",
  property: "ID du bien",
  organization: "ID de l'organisation"
};

const TARGET_LABEL: Record<string, string> = {
  user: "Utilisateur",
  property: "Bien",
  organization: "Organisation"
};

export function BadgesManager() {
  const { firebaseUser, profile } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulaire nouveau badge
  const [type, setType] = useState<BadgeType>("verified_account");
  const [targetId, setTargetId] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getDocs(query(collection(db, "organizations"), orderBy("createdAt", "desc")))
      .then((snap) => setOrganizations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Organization)))
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    try { setBadges(await listBadgesForOrganization(selectedOrgId)); }
    finally { setLoading(false); }
  }, [selectedOrgId]);

  useEffect(() => { refresh(); }, [refresh]);

  const targetType = BADGE_TARGET_FOR_TYPE[type];

  async function handleGrant() {
    if (!selectedOrgId || !targetId.trim() || !targetLabel.trim()) {
      setError("Sélectionnez une organisation, renseignez l'ID et le nom de la cible.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await grantBadge(
        selectedOrgId,
        { type, targetType, targetId: targetId.trim(), targetLabel: targetLabel.trim(), expiresAt: expiresAt || undefined, notes },
        { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined }
      );
      setSuccess(`Badge ${BADGE_LABELS[type]} attribué avec succès.`);
      setTargetId("");
      setTargetLabel("");
      setExpiresAt("");
      setNotes("");
      await refresh();
    } catch {
      setError("Erreur lors de l'attribution. Vérifiez vos permissions super admin.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(badge: Badge) {
    if (!confirm(`Révoquer le badge ${BADGE_LABELS[badge.type]} de ${badge.targetLabel} ?`)) return;
    try {
      await revokeBadge(selectedOrgId, badge.id, { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined });
      await refresh();
    } catch {
      setError("Révocation impossible.");
    }
  }

  const activeBadges = badges.filter(isBadgeActive);
  const inactiveBadges = badges.filter((b) => !isBadgeActive(b));

  return (
    <div className="space-y-6">
      <PageHeader title="Badges de confiance" description="Attribuez et gérez les badges de vérification et de certification SOBAYA." />

      {/* Sélection organisation */}
      <Card>
        <SelectField
          label="Organisation concernée"
          value={selectedOrgId}
          onChange={setSelectedOrgId}
          help="Sélectionnez l'organisation pour laquelle vous gérez les badges."
        >
          <option value="">Choisir une organisation...</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name} ({org.type})</option>
          ))}
        </SelectField>
      </Card>

      {selectedOrgId ? (
        <>
          {/* Formulaire d'attribution */}
          <Card>
            <p className="mb-4 flex items-center gap-2 font-medium text-sobaya-ink">
              <Plus size={16} /> Attribuer un nouveau badge
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label="Type de badge" value={type} onChange={(v) => setType(v as BadgeType)}>
                {ALL_BADGE_TYPES.map((t) => (
                  <option key={t} value={t}>{BADGE_LABELS[t]}</option>
                ))}
              </SelectField>
              <FormField label={`ID ${TARGET_LABEL[targetType]}`} required help={TARGET_PLACEHOLDER[targetType]}>
                <Input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder={TARGET_PLACEHOLDER[targetType]} />
              </FormField>
              <FormField label={`Nom affiché (${TARGET_LABEL[targetType]})`} required help="Nom visible dans l'interface (pour faciliter l'identification).">
                <Input value={targetLabel} onChange={(e) => setTargetLabel(e.target.value)} placeholder="Ex : Koné Immobilier, M. Traoré..." />
              </FormField>
              <FormField label="Date d'expiration" help="Optionnel. Laissez vide pour une durée illimitée.">
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </FormField>
              <FormField label="Notes internes" help="Non visible par l'utilisateur.">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Réf. document vérifié, date de contrôle..." />
              </FormField>
            </div>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}
            <div className="mt-4 flex justify-end">
              <Button disabled={saving} onClick={handleGrant}>
                <Award size={15} /> {saving ? "Attribution..." : "Attribuer le badge"}
              </Button>
            </div>
          </Card>

          {/* Liste des badges actifs */}
          <Card>
            <p className="mb-4 font-medium text-sobaya-ink">
              Badges actifs ({activeBadges.length})
            </p>
            {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}
            {!loading && activeBadges.length === 0 ? (
              <p className="text-sm text-sobaya-muted">Aucun badge actif pour cette organisation.</p>
            ) : null}
            <div className="space-y-3">
              {activeBadges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between gap-3 rounded-xl border border-sobaya-border p-3">
                  <div>
                    <TrustBadge type={badge.type} size="md" />
                    <p className="mt-1 text-sm font-medium text-sobaya-ink">{badge.targetLabel}</p>
                    <p className="text-xs text-sobaya-muted">
                      {TARGET_LABEL[badge.targetType]} · attribué par {badge.grantedByName ?? "Admin"}
                      {badge.expiresAt ? ` · expire le ${new Date(badge.expiresAt).toLocaleDateString("fr-FR")}` : " · sans expiration"}
                    </p>
                    {badge.notes ? <p className="mt-1 text-xs text-sobaya-muted italic">{badge.notes}</p> : null}
                  </div>
                  <Button variant="secondary" onClick={() => handleRevoke(badge)}>
                    <Trash2 size={14} /> Révoquer
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Historique badges révoqués */}
          {inactiveBadges.length > 0 ? (
            <Card>
              <p className="mb-3 text-sm font-medium text-sobaya-muted">
                Historique — badges révoqués ou expirés ({inactiveBadges.length})
              </p>
              <div className="space-y-2">
                {inactiveBadges.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-3 rounded-xl border border-dashed border-sobaya-border p-3 opacity-60">
                    <TrustBadge type={badge.type} />
                    <p className="text-sm text-sobaya-muted">{badge.targetLabel}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
