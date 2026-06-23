"use client";

import { useState } from "react";
import { Globe, GlobeLock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { publishListing, unpublishListing } from "@/services/listings";
import { setPropertyListingId } from "@/services/properties";
import type { Property } from "@/types/property";
import type { OrganizationType } from "@/types/organization";

export function PropertyListingToggle({
  property,
  organizationId,
  organizationName,
  organizationType,
  onUpdated,
  actor
}: {
  property: Property;
  organizationId: string;
  organizationName: string;
  organizationType: OrganizationType;
  onUpdated: () => void;
  actor?: { userId?: string; userName?: string };
}) {
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isPublished = Boolean(property.publicListingId);

  async function handlePublish() {
    if (!phone.trim()) {
      setError("Indiquez un numéro de contact pour les visiteurs de la marketplace.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const listingId = await publishListing(property, organizationName, organizationType, { contactPhone: phone.trim(), contactWhatsapp: whatsapp.trim() || undefined }, actor);
      await setPropertyListingId(organizationId, property.id, listingId, actor);
      onUpdated();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la publication.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnpublish() {
    if (!property.publicListingId || !confirm("Retirer ce bien de la marketplace ?")) return;
    setSaving(true);
    setError("");
    try {
      await unpublishListing(property.publicListingId, organizationId, property.name, actor);
      await setPropertyListingId(organizationId, property.id, null, actor);
      onUpdated();
    } catch {
      setError("Échec du retrait de l'annonce.");
    } finally {
      setSaving(false);
    }
  }

  if (isPublished) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <Globe size={13} /> Publié sur la marketplace
        </span>
        <Button variant="secondary" disabled={saving} onClick={handleUnpublish}><GlobeLock size={15} /> Retirer</Button>
      </div>
    );
  }

  return (
    <div>
      {!showForm ? (
        <Button variant="secondary" onClick={() => setShowForm(true)}><Globe size={15} /> Publier sur la marketplace</Button>
      ) : (
        <div className="mt-2 max-w-sm space-y-3 rounded-2xl border border-sobaya-border p-4">
          <p className="text-sm font-medium text-sobaya-ink">Contact public pour cette annonce</p>
          <FormField label="Téléphone" required help="Affiché publiquement, cliquable depuis la fiche.">
            <Input placeholder="Ex : 07 88 41 55 22" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </FormField>
          <FormField label="WhatsApp" help="Optionnel, si différent du téléphone.">
            <Input placeholder="Ex : 07 88 41 55 22" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
          </FormField>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button disabled={saving} onClick={handlePublish}>{saving ? "Publication..." : "Publier"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
