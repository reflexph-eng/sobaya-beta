"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Star, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { approveFeaturedListing, listPendingFeaturedRequests, rejectFeaturedListing } from "@/services/listings";
import type { PublicListing } from "@/types/listing";

export function FeaturedRequestsManager() {
  const { firebaseUser, profile } = useAuth();
  const [requests, setRequests] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setRequests(await listPendingFeaturedRequests()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleApprove(listing: PublicListing) {
    const days = durations[listing.id] ?? 30;
    setBusy(listing.id);
    try {
      await approveFeaturedListing(listing.id, listing.organizationId, listing.title, days, { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined });
      await refresh();
    } finally { setBusy(null); }
  }

  async function handleReject(listing: PublicListing) {
    setBusy(listing.id);
    try {
      await rejectFeaturedListing(listing.id, listing.organizationId, listing.title, { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined });
      await refresh();
    } finally { setBusy(null); }
  }

  return (
    <div className="mt-6">
      <p className="mb-3 flex items-center gap-2 text-lg font-medium text-sobaya-ink">
        <Star size={18} className="text-amber-500" /> Demandes de mise en avant
      </p>

      {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}
      {!loading && requests.length === 0 ? (
        <Card className="text-sm text-sobaya-muted">Aucune demande en attente.</Card>
      ) : null}

      <div className="space-y-3">
        {requests.map((listing) => (
          <Card key={listing.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sobaya-ink">{listing.title}</p>
                <p className="mt-1 text-xs text-sobaya-muted">{listing.commune ? `${listing.commune}, ` : ""}{listing.city} · {listing.organizationName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-sobaya-muted">Durée :</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={durations[listing.id] ?? 30}
                    onChange={(event) => setDurations((current) => ({ ...current, [listing.id]: Number(event.target.value) }))}
                    className="w-20"
                  />
                  <span className="text-sobaya-muted">jours</span>
                </div>
                <Button disabled={busy === listing.id} onClick={() => handleApprove(listing)}>
                  <CheckCircle size={15} /> Approuver
                </Button>
                <Button variant="secondary" disabled={busy === listing.id} onClick={() => handleReject(listing)}>
                  <XCircle size={15} /> Refuser
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
