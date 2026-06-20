"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { formatLogDate, listActivityLogs, type ActivityEntityType, type ActivityLog } from "@/services/activity-logs";

const entityLabels: Record<string, string> = { property: "Biens", tenant: "Locataires", contract: "Contrats", payment: "Paiements", organization: "Organisation" };

export function ActivityLogsManager() {
  const { organization } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<ActivityEntityType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try { setLogs(await listActivityLogs(organization.id, filter)); }
    catch { setError("Impossible de charger le journal. Vérifiez les permissions et les index Firestore."); }
    finally { setLoading(false); }
  }, [organization?.id, filter]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-5">
      <PageHeader title="Journal d'activité" description="Suivez les créations, modifications, archivages et restaurations dans l'organisation active." />
      <Card>
        <div className="mb-5 flex flex-wrap gap-2">
          {["all", "property", "tenant", "contract", "payment", "organization"].map((item) => (
            <Button key={item} type="button" variant={filter === item ? "primary" : "secondary"} onClick={() => setFilter(item as ActivityEntityType | "all")}>{item === "all" ? "Tout" : entityLabels[item]}</Button>
          ))}
        </div>
        {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}
        {!loading && !logs.length ? <p className="rounded-xl border border-dashed border-sobaya-border p-5 text-sm text-sobaya-muted">Aucune activité enregistrée.</p> : null}
        <div className="grid gap-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-sobaya-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{log.action.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-sm text-sobaya-muted">{entityLabels[log.entityType] ?? log.entityType} · {log.entityLabel}</p>
                  {log.details ? <p className="mt-1 text-xs text-sobaya-muted">{log.details}</p> : null}
                </div>
                <p className="text-xs text-sobaya-muted">{formatLogDate(log.createdAt)}</p>
              </div>
              <p className="mt-3 text-xs text-sobaya-muted">Par : {log.userName}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
