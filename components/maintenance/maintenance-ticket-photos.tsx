"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMaintenanceTicketPhoto, removeMaintenanceTicketPhoto } from "@/services/maintenance";
import type { MaintenanceTicket } from "@/types/maintenance";
import type { GalleryPhoto } from "@/types/gallery";

export function MaintenanceTicketPhotos({
  organizationId,
  ticket,
  canEdit,
  onChange,
  actor
}: {
  organizationId: string;
  ticket: Pick<MaintenanceTicket, "id" | "title" | "photos">;
  canEdit: boolean;
  onChange: (photos: GalleryPhoto[]) => void;
  actor?: { userId?: string; userName?: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const photos = ticket.photos ?? [];

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const photo = await addMaintenanceTicketPhoto(organizationId, ticket, file, actor);
      onChange([...photos, photo]);
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
      await removeMaintenanceTicketPhoto(organizationId, ticket, photoId, actor);
      onChange(photos.filter((p) => p.id !== photoId));
    } catch {
      setError("Échec de la suppression de la photo.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-sobaya-ink">Photos de l&apos;incident ({photos.length}/10)</p>
        {canEdit && photos.length < 10 ? (
          <Button type="button" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Upload size={16} /> {uploading ? "Envoi..." : "Ajouter une photo"}
          </Button>
        ) : null}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelected} />
      </div>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sobaya-border px-4 py-5 text-center text-sm text-sobaya-muted">
          Aucune photo. {canEdit ? "Une photo aide le prestataire à diagnostiquer le problème avant de se déplacer." : ""}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-sobaya-border">
              <img src={photo.url} alt="Photo de l'incident" className="h-24 w-full object-cover" />
              {canEdit ? (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-black/40 px-2 py-1 opacity-0 transition group-hover:opacity-100">
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
