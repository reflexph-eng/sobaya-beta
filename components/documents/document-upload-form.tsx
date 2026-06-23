"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { uploadDocument } from "@/services/documents";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_ENTITY_LABELS } from "@/types/document";
import type { DocumentCategory, DocumentEntityType, OrgDocument } from "@/types/document";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { Contract } from "@/types/contract";
import type { OwnerMandate } from "@/types/owner-mandate";

export function DocumentUploadForm({
  organizationId,
  properties,
  tenants,
  contracts,
  owners,
  actor,
  defaultEntityType,
  defaultEntityId,
  onUploaded,
  onCancel
}: {
  organizationId: string;
  properties: Property[];
  tenants: Tenant[];
  contracts: Contract[];
  owners: OwnerMandate[];
  actor?: { userId?: string; userName?: string };
  /** Si fourni (ex. depuis l'onglet documents d'une fiche bien), pré-sélectionne le rattachement et le verrouille. */
  defaultEntityType?: DocumentEntityType;
  defaultEntityId?: string;
  onUploaded: (document: OrgDocument) => void;
  onCancel?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [entityType, setEntityType] = useState<DocumentEntityType | "">(defaultEntityType ?? "");
  const [entityId, setEntityId] = useState(defaultEntityId ?? "");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const entityOptions =
    entityType === "property" ? properties.map((p) => ({ id: p.id, label: p.name })) :
    entityType === "tenant" ? tenants.map((t) => ({ id: t.id, label: t.fullName })) :
    entityType === "contract" ? contracts.map((c) => ({ id: c.id, label: c.contractNumber || `${c.propertyName} — ${c.tenantName}` })) :
    entityType === "ownerMandate" ? owners.map((o) => ({ id: o.id, label: o.fullName })) :
    [];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Sélectionnez un fichier à téléverser.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const entityLabel = entityType && entityId ? entityOptions.find((o) => o.id === entityId)?.label : undefined;
      const document = await uploadDocument(
        organizationId,
        file,
        {
          name: name || file.name,
          category,
          entityType: entityType || undefined,
          entityId: entityType ? entityId || undefined : undefined,
          entityLabel,
          notes
        },
        actor
      );
      onUploaded(document);
      setName("");
      setCategory("other");
      setNotes("");
      setFile(null);
      if (!defaultEntityType) { setEntityType(""); setEntityId(""); }
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du téléversement.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField label="Fichier" required help="PDF ou image (JPEG, PNG, WebP), 15 Mo maximum.">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full text-sm text-sobaya-muted file:mr-4 file:rounded-xl file:border-0 file:bg-sobaya-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-sobaya-ink hover:file:bg-sobaya-border"
        />
      </FormField>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Nom du document" help="Laissez vide pour utiliser le nom du fichier.">
          <Input placeholder="Ex : ACD bien Riviera Palmeraie" value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <SelectField label="Catégorie" required value={category} onChange={(value) => setCategory(value as DocumentCategory)}>
          {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <SelectField
          label="Rattacher à"
          value={entityType}
          onChange={(value) => { setEntityType(value as DocumentEntityType | ""); setEntityId(""); }}
          help="Optionnel. Laissez vide pour un document libre de l'organisation."
          disabled={Boolean(defaultEntityType)}
        >
          <option value="">Document libre (non rattaché)</option>
          {Object.entries(DOCUMENT_ENTITY_LABELS).filter(([value]) => value !== "organization").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        {entityType ? (
          <SelectField label={DOCUMENT_ENTITY_LABELS[entityType as DocumentEntityType]} required value={entityId} onChange={setEntityId} disabled={Boolean(defaultEntityId)}>
            <option value="">Sélectionner...</option>
            {entityOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </SelectField>
        ) : null}
      </div>
      <FormField label="Notes" help="Référence, contexte, validité, etc.">
        <textarea className="min-h-16 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </FormField>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button> : null}
        <Button type="submit" disabled={uploading}><Upload size={16} /> {uploading ? "Envoi..." : "Téléverser"}</Button>
      </div>
    </form>
  );
}
