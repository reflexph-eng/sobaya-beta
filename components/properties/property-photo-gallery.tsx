"use client";

import { useRef, useState } from "react";
import { Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addPropertyPhoto, removePropertyPhoto, setPropertyPrimaryPhoto } from "@/services/properties";
import type { Property, PropertyPhoto } from "@/types/property";
import { PROPERTY_PHOTO_MAX } from "@/types/property";

export function PropertyPhotoGallery({
  organizationId,
  property,
  canEdit,
  onChange,
  actor
}: {
  organizationId: string;
  property: Pick<Property, "id" | "name" | "photoGallery">;
  canEdit: boolean;
  onChange: (gallery: PropertyPhoto[]) => void;
  actor?: { userId?: string; userName?: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const gallery = property.photoGallery ?? [];

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const photo = await addPropertyPhoto(organizationId, property, file, actor);
      onChange([...gallery, photo]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi de la photo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(photoId: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    setError("");
    try {
      await removePropertyPhoto(organizationId, property, photoId, actor);
      const remaining = gallery.filter((p) => p.id !== photoId);
      const hadPrimary = gallery.find((p) => p.id === photoId)?.isPrimary;
      const next = hadPrimary && remaining.length > 0 ? remaining.map((p, i) => ({ ...p, isPrimary: i === 0 })) : remaining;
      onChange(next);
    } catch {
      setError("Échec de la suppression de la photo.");
    }
  }

  async function handleSetPrimary(photoId: string) {
    setError("");
    try {
      await setPropertyPrimaryPhoto(organizationId, property, photoId, actor);
      onChange(gallery.map((p) => ({ ...p, isPrimary: p.id === photoId })));
    } catch {
      setError("Échec de la mise à jour de la photo principale.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-sobaya-ink">Photos du bien ({gallery.length}/{PROPERTY_PHOTO_MAX})</p>
        {canEdit && gallery.length < PROPERTY_PHOTO_MAX ? (
          <Button type="button" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Upload size={16} /> {uploading ? "Envoi..." : "Ajouter une photo"}
          </Button>
        ) : null}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelected} />
      </div>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      {gallery.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sobaya-border px-4 py-6 text-center text-sm text-sobaya-muted">
          Aucune photo. {canEdit ? "Ajoutez jusqu'à 6 photos pour valoriser ce bien." : ""}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-sobaya-border">
              <img src={photo.url} alt={property.name} className="h-28 w-full object-cover sm:h-32" />
              {photo.isPrimary ? (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-sobaya-primary px-2 py-0.5 text-[11px] font-medium text-white">
                  <Star size={11} /> Principale
                </span>
              ) : null}
              {canEdit ? (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-black/40 px-2 py-1 opacity-0 transition group-hover:opacity-100">
                  {!photo.isPrimary ? (
                    <button type="button" title="Définir comme photo principale" onClick={() => handleSetPrimary(photo.id)} className="rounded-md bg-white/90 p-1.5 text-sobaya-ink hover:bg-white">
                      <Star size={13} />
                    </button>
                  ) : null}
                  <button type="button" title="Supprimer" onClick={() => handleRemove(photo.id)} className="rounded-md bg-white/90 p-1.5 text-red-600 hover:bg-white">
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
