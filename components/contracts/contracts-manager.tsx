"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SimpleTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ContractForm } from "@/components/contracts/contract-form";
import { useAuth } from "@/components/providers/auth-provider";
import { archiveContract, createContract, listContracts, updateContract } from "@/services/contracts";
import { listPayments } from "@/services/payments";
import { computeRentSituation } from "@/services/rent-arrears";
import { listProperties } from "@/services/properties";
import { listTenants } from "@/services/tenants";
import type { Contract, ContractFormValues } from "@/types/contract";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { Payment } from "@/types/payment";

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  active: "Actif",
  expired: "Expiré",
  suspended: "Suspendu",
  terminated: "Résilié"
};

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function ContractsManager() {
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("search") ?? "").trim().toLowerCase();
  const { firebaseUser, organization, profile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    const [contractsData, propertiesData, tenantsData, paymentsData] = await Promise.all([
      listContracts(organization.id).catch(() => []),
      listProperties(organization.id).catch(() => []),
      listTenants(organization.id).catch(() => []),
      listPayments(organization.id).catch(() => [])
    ]);
    setContracts(contractsData);
    setProperties(propertiesData);
    setTenants(tenantsData);
    setPayments(paymentsData);
    setLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const renewing = contracts.filter((contract) => {
      if (!contract.endDate) return false;
      const remaining = (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return remaining >= 0 && remaining <= 30;
    }).length;
    return [
      { label: "Contrats", value: contracts.length },
      { label: "Actifs", value: contracts.filter((item) => item.status === "active").length },
      { label: "Expirés", value: contracts.filter((item) => item.status === "expired").length },
      { label: "À renouveler", value: renewing }
    ];
  }, [contracts]);

  const visibleContracts = useMemo(() => {
    if (!searchTerm) return contracts;
    return contracts.filter((contract) => `${contract.contractNumber} ${contract.tenantName} ${contract.propertyName} ${contract.ownerName}`.toLowerCase().includes(searchTerm));
  }, [contracts, searchTerm]);

  async function handleSubmit(values: ContractFormValues) {
    if (!organization?.id) return;
    if (editing) {
      await updateContract(organization.id, editing.id, values, properties, tenants, { userId: firebaseUser?.uid, userName: profile?.displayName });
      setEditing(null);
    } else {
      await createContract(organization.id, values, properties, tenants, { userId: firebaseUser?.uid, userName: profile?.displayName });
    }
    await refresh();
  }

  async function handleDelete(contract: Contract) {
    if (!organization?.id) return;
    if (!confirm(`Archiver le contrat ${contract.contractNumber} ?`)) return;
    await archiveContract(organization.id, contract, { userId: firebaseUser?.uid, userName: profile?.displayName });
    await refresh();
  }

  return (
    <>
      <PageHeader title="Contrats" description="Liez les biens, locataires, loyers, dates et statuts contractuels." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <p className="text-lg font-medium">{editing ? "Modifier le contrat" : "Nouveau contrat"}</p>
          <p className="mt-1 text-sm text-sobaya-muted">Un contrat associe un bien, un locataire et une échéance de paiement.</p>
          <div className="mt-5">
            <ContractForm contract={editing} properties={properties} tenants={tenants} contracts={contracts} onSubmit={handleSubmit} onCancel={editing ? () => setEditing(null) : undefined} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-medium">Liste des contrats</p>
              <p className="text-sm text-sobaya-muted">{contracts.length} contrat(s) dans cette organisation.</p>
            </div>
          </div>
          {searchTerm ? <div className="mt-3"><StatusBadge tone="neutral">Recherche : « {searchParams.get("search")} »</StatusBadge></div> : null}
          <div className="mt-4 grid gap-3">
            {loading ? <p className="text-sm text-sobaya-muted">Chargement des contrats...</p> : null}
            {!loading && contracts.length === 0 ? (
              <EmptyState
                icon={<FileText size={34} />}
                title="Aucun contrat enregistré"
                description="Créez un contrat pour lier un bien, un locataire, un loyer et une échéance mensuelle."
              />
            ) : null}
            {!loading && contracts.length > 0 && visibleContracts.length === 0 ? (
              <Card className="text-sm text-sobaya-muted">Aucun contrat ne correspond à la recherche.</Card>
            ) : null}
            {visibleContracts.map((contract) => {
              const situation = computeRentSituation(contract, payments);
              return (
              <div key={contract.id} className="rounded-2xl border border-sobaya-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{contract.contractNumber || "Contrat sans numéro"}</p>
                    <p className="mt-1 text-sm text-sobaya-muted">{contract.propertyName} · {contract.tenantName}</p>
                    <p className="mt-1 text-sm text-sobaya-muted">{contract.startDate} → {contract.endDate}</p>
                  </div>
                  <StatusBadge tone={situation.status === "late" ? "danger" : situation.status === "partial" ? "warning" : situation.status === "advance" ? "success" : undefined}>{statusLabels[contract.status] ?? contract.status}</StatusBadge>
                </div>
                <div className="mt-4">
                  <SimpleTabs
                    tabs={[
                      { key: "general", label: "Général", content: <div className="grid gap-2 text-sm text-sobaya-muted sm:grid-cols-3"><p>Loyer : <span className="text-sobaya-ink">{money(contract.monthlyRent)}</span></p><p>Charges : <span className="text-sobaya-ink">{money(contract.charges)}</span></p><p>Échéance : <span className="text-sobaya-ink">jour {contract.dueDay}</span></p></div> },
                      { key: "payments", label: "Paiements", content: <div className="text-sm"><p className="font-medium text-sobaya-ink">Situation : {situation.status === "late" ? "En retard" : situation.status === "partial" ? "Paiement partiel" : situation.status === "advance" ? "En avance" : situation.status === "inactive" ? "Non actif" : "À jour"}</p><p className="mt-1 text-sobaya-muted">Dernier mois payé : {situation.lastPaidLabel} · Prochaine période : {situation.nextPeriodLabel}</p></div> },
                      { key: "arrears", label: "Arriérés", content: situation.totalDue > 0 ? <p className="text-sm text-red-600">Arriérés : {money(situation.totalDue)} · {situation.dueMonths.map((month) => month.label).slice(0, 3).join(", ")}{situation.dueMonths.length > 3 ? "..." : ""}</p> : <p className="text-sm text-emerald-700">Aucun arriéré sur ce contrat.</p> },
                      { key: "documents", label: "Documents", content: <p className="text-sm text-sobaya-muted">Préparation Sprint 11 : contrats, pièces jointes, assurances et documents locataires.</p> }
                    ]}
                  />
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button type="button" variant="secondary" onClick={() => setEditing(contract)}>Modifier</Button>
                  <Button type="button" variant="ghost" onClick={() => handleDelete(contract)}>Archiver</Button>
                </div>
              </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
