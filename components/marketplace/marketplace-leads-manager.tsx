"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { listContactRequestsForOrganization } from "@/services/listings";
import type { ListingContactRequest } from "@/types/listing";

const statusLabels: Record<ListingContactRequest["status"], string> = {
  new: "Nouvelle",
  contacted: "Contactée",
  closed: "Clôturée"
};

const statusTone: Record<ListingContactRequest["status"], "warning" | "success" | "neutral"> = {
  new: "warning",
  contacted: "success",
  closed: "neutral"
};

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = (value as { toDate?: () => Date }).toDate ? (value as { toDate: () => Date }).toDate() : new Date(value as string);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function MarketplaceLeadsManager() {
  const { organization } = useAuth();
  const [requests, setRequests] = useState<ListingContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      setRequests(await listContactRequestsForOrganization(organization.id));
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const newCount = requests.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-5">
      <PageHeader title="Demandes marketplace" description="Visiteurs ayant manifesté un intérêt pour vos annonces publiées." />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total" value={requests.length} helper="Toutes demandes" />
        <MetricCard label="Nouvelles" value={newCount} helper="À traiter" />
        <MetricCard label="Annonces publiées" value={new Set(requests.map((r) => r.listingId)).size} helper="Ayant généré une demande" />
      </div>

      <Card>
        {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}

        {!loading && requests.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={34} />}
            title="Aucune demande pour le moment"
            description="Les demandes envoyées depuis vos annonces publiées sur la marketplace apparaîtront ici."
          />
        ) : null}

        <div className="grid gap-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-sobaya-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-sobaya-ink">{request.visitorName}</p>
                <StatusBadge tone={statusTone[request.status]}>{statusLabels[request.status]}</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-sobaya-muted">{request.message}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <a href={`tel:${request.visitorPhone}`} className="inline-flex items-center gap-1.5 text-sobaya-primary hover:underline"><Phone size={14} /> {request.visitorPhone}</a>
                {request.visitorEmail ? <a href={`mailto:${request.visitorEmail}`} className="inline-flex items-center gap-1.5 text-sobaya-primary hover:underline"><Mail size={14} /> {request.visitorEmail}</a> : null}
              </div>
              <p className="mt-2 text-xs text-sobaya-muted">{formatDate(request.createdAt)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
