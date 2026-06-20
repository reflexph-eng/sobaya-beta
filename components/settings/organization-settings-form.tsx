"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { updateOrganizationName } from "@/services/organizations";

export function OrganizationSettingsForm() {
  const { organization, member, refreshSession } = useAuth();
  const [name, setName] = useState(organization?.name ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canEdit = member?.permissions.includes("settings.manage");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization || !canEdit) return;
    setLoading(true);
    setMessage("");
    await updateOrganizationName(organization.id, name);
    await refreshSession();
    setMessage("Organisation mise à jour.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      <FormField label="Nom de l’organisation" required help="Nom affiché dans le tableau de bord et les futurs documents SOBAYA.">
        <Input value={name} onChange={(event) => setName(event.target.value)} disabled={!canEdit} placeholder="Ex : Agence Immobilière Horizon" required />
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
