"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { listGlobalActivityLogs } from "@/services/admin-saas";
import { formatLogDate, type ActivityLog } from "@/services/activity-logs";

export function GlobalAuditManager() {
  const [logs, setLogs] = useState<(ActivityLog & { organizationName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); try { setLogs(await listGlobalActivityLogs() as any); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  return <SuperAdminGate><div className="space-y-5"><PageHeader title="Journal global" description="Audit logs consolidés sur toutes les organisations." />
    <div className="flex justify-end"><Button variant="secondary" onClick={load} disabled={loading}>{loading ? "Chargement..." : "Actualiser"}</Button></div>
    <Card><div className="space-y-3">{logs.map((log) => <div key={`${log.organizationId}-${log.id}`} className="rounded-xl border border-sobaya-border p-4 text-sm"><div className="flex flex-wrap items-center gap-2"><Activity size={16}/><p className="font-medium">{log.action}</p><span className="text-sobaya-muted">· {log.organizationName ?? log.organizationId}</span></div><p className="mt-1 text-sobaya-muted">{log.entityLabel} — {log.details}</p><p className="mt-1 text-xs text-sobaya-muted">{formatLogDate(log.createdAt)} · {log.userName}</p></div>)}{!loading && logs.length === 0 ? <p className="text-sm text-sobaya-muted">Aucun journal global disponible.</p> : null}{loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}</div></Card>
  </div></SuperAdminGate>;
}
