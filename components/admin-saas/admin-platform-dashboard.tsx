"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Bell, Building2, CreditCard, FileText, Home, Search, Settings, Shield, Users, Wrench } from "lucide-react";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { computePlatformStats, listAdminOrganizationSummaries } from "@/services/admin-saas";
import type { AdminOrganizationSummary } from "@/types/admin-saas";

const cards = [
  { href: "/admin/organizations", title: "Organisations", description: "Suspendre, réactiver, archiver et diagnostiquer les clients.", icon: Building2 },
  { href: "/admin/platform", title: "Statistiques plateforme", description: "KPI globaux SaaS, usage, volumes et activité.", icon: Shield },
  { href: "/admin/audit", title: "Journal global", description: "Traçabilité multi-organisations sur les actions importantes.", icon: Activity },
  { href: "/admin/search", title: "Recherche globale", description: "Retrouver un bien, locataire, contrat, paiement ou ticket.", icon: Search },
  { href: "/admin/support", title: "Support & diagnostic", description: "Vue support par organisation et derniers signaux d’activité.", icon: Wrench },
  { href: "/admin/settings", title: "Paramètres SaaS", description: "Modules actifs et préparation configuration plateforme.", icon: Settings }
];

export function AdminPlatformDashboard() {
  const [organizations, setOrganizations] = useState<AdminOrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setOrganizations(await listAdminOrganizationSummaries()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  const stats = useMemo(() => computePlatformStats(organizations), [organizations]);
  const recentOrganizations = organizations.slice(0, 5);

  return (
    <SuperAdminGate>
      <div className="space-y-6">
        <PageHeader title="Administration SaaS" description="Cockpit Super Admin pour piloter SOBAYA BETA 1.0." />
        <div className="flex justify-end"><Button variant="secondary" onClick={load} disabled={loading}>{loading ? "Actualisation..." : "Actualiser"}</Button></div>
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Organisations" value={stats.organizationsTotal} />
          <MetricCard label="Utilisateurs" value={stats.usersTotal} />
          <MetricCard label="Biens" value={stats.propertiesTotal} />
          <MetricCard label="Encaissements" value={`${stats.totalCollected.toLocaleString("fr-FR")} FCFA`} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href}><Card className="h-full transition hover:bg-sobaya-soft/60"><Icon size={24}/><p className="mt-4 text-lg font-medium">{item.title}</p><p className="mt-2 text-sm text-sobaya-muted">{item.description}</p></Card></Link>;
          })}
        </div>
        <Card>
          <div className="mb-4 flex items-center justify-between"><p className="font-medium">Organisations récentes</p><StatusBadge>{loading ? "Chargement" : `${organizations.length} organisation(s)`}</StatusBadge></div>
          <div className="space-y-3">
            {recentOrganizations.map((org) => <div key={org.id} className="grid gap-2 rounded-xl border border-sobaya-border p-4 text-sm md:grid-cols-5"><div className="md:col-span-2"><p className="font-medium">{org.name}</p><p className="text-xs text-sobaya-muted">{org.subscriptionPlan} · {org.subscriptionStatus}</p></div><p>{org.propertiesCount} biens</p><p>{org.contractsCount} contrats</p><p>{org.totalCollected.toLocaleString("fr-FR")} FCFA</p></div>)}
            {!loading && recentOrganizations.length === 0 ? <p className="text-sm text-sobaya-muted">Aucune organisation détectée.</p> : null}
          </div>
        </Card>
        <Card><div className="flex gap-3"><Bell className="mt-1 text-sobaya-muted" size={22}/><div><p className="font-medium">Patch 10.1 prêt pour la bêta</p><p className="mt-1 text-sm text-sobaya-muted">L’administration SaaS reste Firestore uniquement et prépare les abonnements, sans intégrer encore les paiements externes.</p></div></div></Card>
      </div>
    </SuperAdminGate>
  );
}
