"use client";
import Image from "next/image";

import Link from "next/link";
import { Home, MapPin, MessageCircle, Phone } from "lucide-react";
import { TrustBadge } from "@/components/ui/trust-badge";
import { isCurrentlyFeatured } from "@/services/listings";
import type { Organization } from "@/types/organization";
import type { PublicListing } from "@/types/listing";
import type { BadgeType } from "@/types/badge";

const ORG_TYPE_LABELS: Record<string, string> = {
  owner: "Propriétaire particulier",
  real_estate_agent: "Agent immobilier",
  agency: "Agence immobilière",
  enterprise: "Entreprise"
};

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function AgenceVitrine({
  organization,
  listings,
  badgeTypes
}: {
  organization: Organization;
  listings: PublicListing[];
  badgeTypes: BadgeType[];
}) {
  const available = listings.filter((l) => l.isActive);
  const featured = available.filter(isCurrentlyFeatured);
  const regular = available.filter((l) => !isCurrentlyFeatured(l));
  const sorted = [...featured, ...regular];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16">
      {/* En-tête vitrine */}
      <div className="my-8 rounded-2xl border border-sobaya-border bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-sobaya-muted">
              {ORG_TYPE_LABELS[organization.type] ?? "Annonceur"}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-sobaya-ink">{organization.name}</h1>
            {badgeTypes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {badgeTypes.map((type) => <TrustBadge key={type} type={type} size="md" />)}
              </div>
            ) : null}
            <p className="mt-4 text-sobaya-muted">
              {available.length > 0
                ? `${available.length} bien(s) disponible(s) actuellement sur SOBAYA.`
                : "Aucun bien disponible pour le moment. Revenez bientôt."}
            </p>
          </div>
          {/* Coordonnées */}
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-sobaya-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-sobaya-primaryDark"
            >
              Voir toutes les annonces SOBAYA
            </Link>
          </div>
        </div>
      </div>

      {/* Liste des biens */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sobaya-border py-16 text-center">
          <Home size={36} className="text-sobaya-muted" />
          <p className="font-medium text-sobaya-ink">Aucun bien disponible pour l&apos;instant</p>
          <p className="text-sm text-sobaya-muted">Revenez prochainement pour découvrir les annonces de {organization.name}.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((listing) => (
            <Link
              key={listing.id}
              href={`/marketplace/${listing.id}`}
              className="group overflow-hidden rounded-2xl border border-sobaya-border bg-white transition hover:shadow-soft"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-sobaya-soft">
                {listing.photoGallery?.[0] ? (
                  <Image src={listing.photoGallery[0].url} alt={listing.title} className="h-full w-full object-cover transition group-hover:scale-105" fill unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-sobaya-muted">
                    <Home size={32} />
                  </div>
                )}
                {isCurrentlyFeatured(listing) ? (
                  <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                    ⭐ En vedette
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <p className="font-medium text-sobaya-ink">{listing.title}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-sobaya-muted">
                  <MapPin size={12} />
                  {listing.commune ? `${listing.commune}, ` : ""}{listing.city}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-semibold text-sobaya-primary">
                    {money(listing.monthlyRent)}
                    <span className="text-xs font-normal text-sobaya-muted"> /mois</span>
                  </p>
                  <p className="text-xs text-sobaya-muted">{listing.rooms} pièce(s)</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA inscription */}
      <div className="mt-12 rounded-2xl border border-sobaya-border bg-sobaya-soft p-6 text-center">
        <p className="font-semibold text-sobaya-ink">Vous êtes propriétaire ou agent immobilier ?</p>
        <p className="mt-1 text-sm text-sobaya-muted">Rejoignez SOBAYA et publiez vos annonces avec votre propre vitrine numérique.</p>
        <Link
          href="/register"
          className="mt-4 inline-block rounded-xl bg-sobaya-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-sobaya-primaryDark"
        >
          Créer mon espace SOBAYA
        </Link>
      </div>
    </div>
  );
}
