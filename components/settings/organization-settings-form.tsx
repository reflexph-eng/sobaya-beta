"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { updateOrganizationSettings } from "@/services/organizations";

export function OrganizationSettingsForm() {
  const { organization, member, refreshSession } = useAuth();
  const [name, setName] = useState(organization?.name ?? "");
  const [receiptDisplayName, setReceiptDisplayName] = useState(organization?.receiptDisplayName ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canEdit = member?.permissions.includes("settings.manage");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Double guard : organisation non chargée ou droits insuffisants → on sort.
    if (!organization?.id || !canEdit) return;
    setLoading(true);
    setMessage("");
    try {
      // org est maintenant une référence locale stable, TypeScript sait qu'elle est non-null.
      const orgId = organization.id;
      await updateOrganizationSettings(orgId, {
        name,
        receiptDisplayName: receiptDisplayName || undefined
      });
      await refreshSession();
      setMessage("Organisation mise à jour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      <FormField label="Nom de l&apos;organisation" required help="Nom technique affiché dans votre tableau de bord.">
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} placeholder="Ex : Agence Immobilière Horizon" required />
      </FormField>
      <FormField
        label="Nom affiché sur les quittances et documents"
        help="Ce nom apparaîtra comme émetteur sur toutes vos quittances. Si vide, le nom de l&apos;organisation est utilisé."
      >
        <Input
          value={receiptDisplayName}
          onChange={(e) => setReceiptDisplayName(e.target.value)}
          disabled={!canEdit}
          placeholder={`Ex : ${name || "Votre nom commercial"}`}
        />
      </FormField>
      <div className="grid gap-3 rounded-2xl border border-sobaya-border bg-white p-4 text-sm text-sobaya-muted">
        <p>Plan : {organization?.subscriptionPlan}</p>
        <p>Statut abonnement : {organization?.subscriptionStatus}</p>
        <p>Votre rôle : {member?.role}</p>
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Button type="submit" disabled={!canEdit || loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
    </form>
  );
}
