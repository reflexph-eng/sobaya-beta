"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Building2, CreditCard, FileText, Home, Users, Wrench } from "lucide-react";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { computePlatformStats, listAdminOrganizationSummaries } from "@/services/admin-saas";
import type { AdminOrganizationSummary } from "@/types/admin-saas";

export function PlatformStatsManager() {
  const [organizations, setOrganizations] = useState<AdminOrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); try { setOrganizations(await listAdminOrganizationSummaries()); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  const stats = useMemo(() => computePlatformStats(organizations), [organizations]);

  return <SuperAdminGate><div className="space-y-5"><PageHeader title="Statistiques plateforme" description="Vue globale SaaS sans API externe." />
    <div className="flex justify-end"><Button variant="secondary" onClick={load} disabled={loading}>{loading ? "Chargement..." : "Actualiser"}</Button></div>
    <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Organisations" value={stats.organizationsTotal}/><MetricCard label="Actives" value={stats.organizationsActive}/><MetricCard label="Suspendues" value={stats.organizationsSuspended}/><MetricCard label="Archivées" value={stats.organizationsArchived}/></div>
    <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Utilisateurs" value={stats.usersTotal}/><MetricCard label="Biens" value={stats.propertiesTotal}/><MetricCard label="Locataires" value={stats.tenantsTotal}/><MetricCard label="Contrats" value={stats.contractsTotal}/></div>
    <div className="grid gap-4 md:grid-cols-4"><MetricCard label="Paiements" value={stats.paymentsTotal}/><MetricCard label="Encaissé global" value={`${stats.totalCollected.toLocaleString("fr-FR")} FCFA`}/><MetricCard label="Tickets maintenance" value={stats.maintenanceOpen}/><MetricCard label="Notifications" value={stats.notificationsTotal}/></div>
    <Card><p className="font-medium">Lecture stratégique</p><p className="mt-2 text-sm text-sobaya-muted">Ces indicateurs servent à suivre la santé de SOBAYA pendant la phase pilote : adoption, volume métier, activité financière et charge support.</p></Card>
  </div></SuperAdminGate>;
}
