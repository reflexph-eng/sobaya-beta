"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { globalAdminSearch } from "@/services/admin-saas";
import type { AdminGlobalSearchResult } from "@/types/admin-saas";

export function GlobalSearchManager() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<AdminGlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  async function runSearch() { setLoading(true); try { setResults(await globalAdminSearch(term)); } finally { setLoading(false); } }
  return <SuperAdminGate><div className="space-y-5"><PageHeader title="Recherche globale" description="Recherche support multi-organisations." />
    <Card><div className="grid gap-3 md:grid-cols-[1fr_auto]"><Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Ex : Koffi, Maison 1, reçu, téléphone..." onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} /><Button onClick={runSearch} disabled={loading || term.trim().length < 2}><Search size={16}/> Rechercher</Button></div></Card>
    <div className="space-y-3">{results.map((item) => <Card key={`${item.organizationId}-${item.type}-${item.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><StatusBadge>{item.type}</StatusBadge><p className="font-medium">{item.title}</p></div><p className="mt-2 text-sm text-sobaya-muted">{item.subtitle}</p><p className="mt-1 text-xs text-sobaya-muted">Organisation : {item.organizationName}</p></div><a href={item.href} className="text-sm font-medium text-sobaya-primary">Ouvrir module</a></div></Card>)}{!loading && term && results.length === 0 ? <Card><p className="text-sm text-sobaya-muted">Aucun résultat.</p></Card> : null}{loading ? <Card><p className="text-sm text-sobaya-muted">Recherche en cours...</p></Card> : null}</div>
  </div></SuperAdminGate>;
}
