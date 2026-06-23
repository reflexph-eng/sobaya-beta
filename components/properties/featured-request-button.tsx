"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestFeaturedListing, getPublicListingByPropertyId, isCurrentlyFeatured } from "@/services/listings";
import type { PublicListing } from "@/types/listing";

export function FeaturedRequestButton({
  publicListingId,
  propertyId,
  organizationId,
  propertyName,
  actor
}: {
  publicListingId: string;
  propertyId: string;
  organizationId: string;
  propertyName: string;
  actor?: { userId?: string; userName?: string };
}) {
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicListingByPropertyId(propertyId)
      .then(setListing)
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) return null;
  if (!listing) return null;

  const featured = isCurrentlyFeatured(listing);
  const pending = listing.featuredRequest === "pending";

  if (featured) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
        <Star size={13} fill="currentColor" /> En vedette jusqu&apos;au {new Date(listing.featuredUntil!).toLocaleDateString("fr-FR")}
      </span>
    );
  }

  if (pending || done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sobaya-border bg-sobaya-soft px-3 py-1.5 text-xs text-sobaya-muted">
        <Star size={13} /> Demande envoyée — en attente de validation
      </span>
    );
  }

  async function handleRequest() {
    if (!listing) return;
    setRequesting(true);
    setError("");
    try {
      await requestFeaturedListing(publicListingId, organizationId, propertyName, actor);
      setDone(true);
    } catch {
      setError("Échec de l'envoi. Réessayez.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" disabled={requesting} onClick={handleRequest}>
        <Star size={15} /> {requesting ? "Envoi..." : "Demander la mise en avant"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
