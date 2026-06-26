"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminOrganizationSummaries, saveSubscriptionDraft } from "@/services/admin-saas";
import type { AdminOrganizationSummary } from "@/types/admin-saas";

export function SubscriptionsAdminManager() {
  const [organizations, setOrganizations] = useState<AdminOrganizationSummary[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  async function load() { setOrganizations(await listAdminOrganizationSummaries()); }
  useEffect(() => { load(); }, []);
  async function setPlan(org: AdminOrganizationSummary, plan: "starter" | "pro" | "agence") {
    setBusyId(org.id);
    try { await saveSubscriptionDraft({ organizationId: org.id, organizationName: org.name, plan, status: "trial" }); await load(); }
    finally { setBusyId(null); }
  }
  return <SuperAdminGate><div className="space-y-5"><PageHeader title="Abonnements" description="Gestion des plans d'abonnement des organisations." />
    <div className="space-y-3">{organizations.map((org) => <Card key={org.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{org.name}</p><p className="mt-1 text-sm text-sobaya-muted">Plan actuel : {org.subscriptionPlan}</p></div><div className="flex flex-wrap gap-2"><StatusBadge>{org.subscriptionStatus}</StatusBadge><Button variant="secondary" disabled={busyId === org.id} onClick={() => setPlan(org, "starter")}>Starter</Button><Button variant="secondary" disabled={busyId === org.id} onClick={() => setPlan(org, "pro")}>Pro</Button><Button variant="secondary" disabled={busyId === org.id} onClick={() => setPlan(org, "agence")}>Agence</Button></div></div></Card>)}</div>
  </div></SuperAdminGate>;
}
