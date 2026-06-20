"use client";

import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminOrganizationSummaries } from "@/services/admin-saas";
import type { AdminOrganizationSummary } from "@/types/admin-saas";

export function SupportDiagnosticManager() {
  const [organizations, setOrganizations] = useState<AdminOrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); try { setOrganizations(await listAdminOrganizationSummaries()); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  return <SuperAdminGate><div className="space-y-5"><PageHeader title="Support & diagnostic" description="Identifier rapidement les organisations qui nécessitent une assistance." />
    <div className="flex justify-end"><Button variant="secondary" onClick={load} disabled={loading}>{loading ? "Chargement..." : "Actualiser"}</Button></div>
    <div className="space-y-3">{organizations.map((org) => {
      const warning = org.propertiesCount === 0 || org.contractsCount === 0 || org.status === "suspended";
      return <Card key={org.id}><div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr]"><div><div className="flex items-center gap-2"><LifeBuoy size={18}/><p className="font-medium">{org.name}</p><StatusBadge tone={warning ? "warning" : "success"}>{warning ? "À surveiller" : "OK"}</StatusBadge></div><p className="mt-1 text-xs text-sobaya-muted">{org.id}</p></div><div className="text-sm text-sobaya-muted"><p>{org.usersCount} utilisateur(s)</p><p>{org.propertiesCount} bien(s)</p></div><div className="text-sm text-sobaya-muted"><p>{org.tenantsCount} locataire(s)</p><p>{org.contractsCount} contrat(s)</p></div><div className="text-sm text-sobaya-muted"><p>{org.maintenanceTicketsCount} ticket(s)</p><p>{org.notificationsCount} notification(s)</p></div></div></Card>;
    })}{!loading && organizations.length === 0 ? <Card><p className="text-sm text-sobaya-muted">Aucune organisation à diagnostiquer.</p></Card> : null}{loading ? <Card><p className="text-sm text-sobaya-muted">Chargement...</p></Card> : null}</div>
  </div></SuperAdminGate>;
}
