/**
 * Type générique de photo stockée dans Firebase Storage, utilisé par plusieurs
 * modules (galerie de biens, photos d'incident maintenance...). Le type
 * PropertyPhoto historique (types/property.ts) reste inchangé pour ne pas
 * casser le module Biens ; les nouveaux usages peuvent s'appuyer sur celui-ci.
 */
export interface GalleryPhoto {
  id: string;
  url: string;
  storagePath: string;
  uploadedAt: Date | unknown;
}
