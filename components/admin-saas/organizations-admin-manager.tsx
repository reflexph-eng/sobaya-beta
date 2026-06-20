"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminOrganizationSummaries, updateOrganizationAdminStatus } from "@/services/admin-saas";
import type { AdminOrganizationSummary } from "@/types/admin-saas";

function statusTone(status?: string) { return status === "suspended" ? "warning" : status === "archived" ? "danger" : "success"; }

export function OrganizationsAdminManager() {
  const [organizations, setOrganizations] = useState<AdminOrganizationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() { setLoading(true); try { setOrganizations(await listAdminOrganizationSummaries()); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => organizations.filter((org) => `${org.name} ${org.ownerId} ${org.subscriptionPlan}`.toLowerCase().includes(search.toLowerCase())), [organizations, search]);

  async function changeStatus(org: AdminOrganizationSummary, status: "active" | "suspended" | "archived") {
    setBusyId(org.id);
    try { await updateOrganizationAdminStatus(org.id, status); await load(); }
    finally { setBusyId(null); }
  }

  return <SuperAdminGate><div className="space-y-5"><PageHeader title="Organisations" description="Centre de contrôle des organisations clientes SOBAYA." />
    <Card><div className="grid gap-3 md:grid-cols-[1fr_auto]"><Input placeholder="Rechercher une organisation..." value={search} onChange={(e) => setSearch(e.target.value)} /><Button variant="secondary" onClick={load}><RefreshCw size={16}/> Actualiser</Button></div></Card>
    <div className="space-y-3">{filtered.map((org) => <Card key={org.id}><div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_auto]"><div><div className="flex items-center gap-2"><Building2 size={18}/><p className="font-medium">{org.name}</p><StatusBadge tone={statusTone(org.status) as any}>{org.status ?? "active"}</StatusBadge></div><p className="mt-1 text-xs text-sobaya-muted">Plan {org.subscriptionPlan} · {org.subscriptionStatus}</p></div><div className="text-sm text-sobaya-muted"><p>{org.usersCount} utilisateur(s)</p><p>{org.propertiesCount} bien(s) · {org.contractsCount} contrat(s)</p></div><div className="text-sm text-sobaya-muted"><p>{org.paymentsCount} paiement(s)</p><p>{org.totalCollected.toLocaleString("fr-FR")} FCFA encaissés</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busyId === org.id} onClick={() => changeStatus(org, "active")}>Réactiver</Button><Button variant="secondary" disabled={busyId === org.id} onClick={() => changeStatus(org, "suspended")}>Suspendre</Button><Button variant="ghost" disabled={busyId === org.id} onClick={() => changeStatus(org, "archived")}>Archiver</Button></div></div></Card>)}{!loading && filtered.length === 0 ? <Card><p className="text-sm text-sobaya-muted">Aucune organisation trouvée.</p></Card> : null}{loading ? <Card><p className="text-sm text-sobaya-muted">Chargement...</p></Card> : null}</div>
  </div></SuperAdminGate>;
}
