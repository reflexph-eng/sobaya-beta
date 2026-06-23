"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CreditCard, MessageCircle, Phone, RefreshCw, Search } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { createActivityLog } from "@/services/activity-logs";
import { listContracts } from "@/services/contracts";
import { listPayments } from "@/services/payments";
import { listTenants } from "@/services/tenants";
import { computeRentSituations, type RentSituation } from "@/services/rent-arrears";
import type { Contract } from "@/types/contract";
import type { Payment } from "@/types/payment";
import type { Tenant } from "@/types/tenant";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

function normalizePhone(phone?: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("225")) return digits;
  return `225${digits}`;
}

function reminderMessage(situation: RentSituation, tenant?: Tenant) {
  const dueLabels = situation.dueMonths.slice(0, 4).map((month) => month.label).join(", ");
  const suffix = situation.dueMonths.length > 4 ? ` et ${situation.dueMonths.length - 4} autre(s) mois` : "";
  return `Bonjour ${tenant?.fullName ?? situation.tenantName}, sauf erreur, votre loyer présente un retard de ${situation.dueMonths.length} mois (${dueLabels}${suffix}) pour un montant total de ${money(situation.totalDue)}. Merci de régulariser votre situation. SOBAYA`;
}

function whatsappUrl(phone: string | undefined, message: string) {
  const normalized = normalizePhone(phone);
  if (!normalized) return `https://wa.me/?text=${encodeURIComponent(message)}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function situationTone(status: RentSituation["status"]) {
  if (status === "late") return "danger";
  if (status === "partial") return "warning";
  if (status === "advance") return "success";
  return "neutral";
}

function situationLabel(status: RentSituation["status"]) {
  const labels: Record<RentSituation["status"], string> = {
    up_to_date: "À jour",
    late: "En retard",
    partial: "Partiel",
    advance: "En avance",
    inactive: "Inactif"
  };
  return labels[status];
}

export function ArrearsManager() {
  const searchParams = useSearchParams();
  const focusedContractId = searchParams.get("contractId");
  const { organization, firebaseUser, profile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [contractsData, paymentsData, tenantsData] = await Promise.all([
        listContracts(organization.id),
        listPayments(organization.id),
        listTenants(organization.id)
      ]);
      setContracts(contractsData);
      setPayments(paymentsData);
      setTenants(tenantsData);
    } catch {
      setError("Impossible de charger les impayés. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rows = useMemo(() => {
    const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
    const activeContractIds = new Set(contracts.filter((contract) => contract.status === "active" && contract.isDeleted !== true).map((contract) => contract.id));
    return computeRentSituations(contracts, payments)
      .filter((situation) => activeContractIds.has(situation.contractId) && situation.totalDue > 0)
      .map((situation) => {
        const contract = contracts.find((item) => item.id === situation.contractId);
        const tenant = contract?.tenantId ? tenantById.get(contract.tenantId) : undefined;
        return { situation, contract, tenant };
      })
      .filter((row) => {
        if (focusedContractId && row.situation.contractId !== focusedContractId) return false;
        const search = query.trim().toLowerCase();
        if (!search) return true;
        return [row.situation.tenantName, row.situation.propertyName, row.contract?.contractNumber, row.tenant?.phone]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((a, b) => b.situation.totalDue - a.situation.totalDue);
  }, [contracts, focusedContractId, payments, query, tenants]);

  const stats = useMemo(() => {
    const totalDue = rows.reduce((sum, row) => sum + row.situation.totalDue, 0);
    const partial = rows.filter((row) => row.situation.partialMonthsCount > 0).length;
    const monthsDue = rows.reduce((sum, row) => sum + row.situation.dueMonths.length, 0);
    return { totalDue, tenantsLate: rows.length, partial, monthsDue };
  }, [rows]);

  async function logReminder(row: { situation: RentSituation; tenant?: Tenant }) {
    if (!organization?.id) return;
    await createActivityLog(organization.id, {
      action: "TENANT_REMINDER_SENT",
      entityType: "tenant",
      entityId: row.tenant?.id ?? row.situation.contractId,
      entityLabel: row.tenant?.fullName ?? row.situation.tenantName,
      details: `Relance impayé : ${row.situation.dueMonths.length} mois dû(s), ${money(row.situation.totalDue)}.`,
      userId: firebaseUser?.uid,
      userName: profile?.displayName ?? profile?.email ?? "Utilisateur SOBAYA"
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Impayés & relances" description="Liste opérationnelle des loyers en retard, avec action WhatsApp et encaissement rapide." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total à recouvrer" value={money(stats.totalDue)} compact helper="Selon le moteur d'arriérés 10.2" href="/impayes" />
        <MetricCard label="Locataires en retard" value={stats.tenantsLate} helper="Contrats actifs concernés" href="/locataires?statut=retard" />
        <MetricCard label="Mois dus" value={stats.monthsDue} helper="Mois impayés ou partiels" href="/rapports?vue=arriérés" />
        <MetricCard label="Paiements partiels" value={stats.partial} helper="À compléter" href="/impayes?statut=partiel" />
      </div>

      {focusedContractId ? (
        <Card className="border-sobaya-primary/20 bg-sobaya-soft/40 text-sm text-sobaya-muted">Filtre actif depuis le dashboard : contrat ciblé. <ButtonLink href="/impayes" variant="secondary" className="ml-2 min-h-9 px-3 py-1">Voir tous les impayés</ButtonLink></Card>
      ) : null}

      <Card className="border-sobaya-primary/15 bg-sobaya-soft/30">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sobaya-muted" size={17} />
            <Input className="pl-10" placeholder="Rechercher un locataire, bien, contrat ou téléphone..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <Button variant="secondary" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Actualiser</Button>
        </div>
      </Card>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-sobaya-muted">Chargement des impayés...</p> : null}

      <div className="grid gap-3">
        {rows.length === 0 && !loading ? (
          <Card className="border-emerald-100 bg-emerald-50 text-sm text-emerald-700">Aucun impayé détecté sur les contrats actifs.</Card>
        ) : null}

        {rows.map((row) => {
          const message = reminderMessage(row.situation, row.tenant);
          const hasPhone = Boolean(normalizePhone(row.tenant?.phone));
          return (
            <Card key={row.situation.contractId}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={situationTone(row.situation.status)}>{situationLabel(row.situation.status)}</StatusBadge>
                    <StatusBadge tone="danger">{row.situation.dueMonths.length} mois dû(s)</StatusBadge>
                    {!hasPhone ? <StatusBadge tone="warning">Téléphone à vérifier</StatusBadge> : null}
                  </div>
                  <p className="mt-3 text-lg font-semibold">{row.situation.tenantName}</p>
                  <p className="mt-1 text-sm text-sobaya-muted">{row.situation.propertyName} · {row.contract?.contractNumber ?? "Contrat"}</p>
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                    <p>Montant dû : <span className="font-semibold text-red-700">{money(row.situation.totalDue)}</span></p>
                    <p>Dernier mois payé : <span className="font-medium">{row.situation.lastPaidLabel}</span></p>
                    <p>Prochaine régularisation : <span className="font-medium">{row.situation.nextPeriodLabel}</span></p>
                  </div>
                  <div className="mt-3 rounded-2xl border border-sobaya-border bg-sobaya-soft/40 p-3 text-sm text-sobaya-muted">
                    Mois concernés : {row.situation.dueMonths.map((month) => `${month.label} (${money(month.remainingAmount)})`).join(" · ")}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  <a
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sobaya-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-sobaya-primaryDark"
                    href={whatsappUrl(row.tenant?.phone, message)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => logReminder(row)}
                  >
                    <MessageCircle size={16} /> Relancer WhatsApp
                  </a>
                  {row.tenant?.phone ? (
                    <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sobaya-border bg-white px-5 py-2 text-sm font-medium text-sobaya-ink transition hover:bg-sobaya-soft" href={`tel:${row.tenant.phone}`}>
                      <Phone size={16} /> Appeler
                    </a>
                  ) : null}
                  <ButtonLink href={`/paiements?contractId=${row.situation.contractId}`} variant="secondary"><CreditCard size={16} /> Encaisser</ButtonLink>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
