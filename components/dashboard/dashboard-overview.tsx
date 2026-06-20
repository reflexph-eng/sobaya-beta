"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, CreditCard, Home, PieChart, ReceiptText, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { listProperties } from "@/services/properties";
import { listTenants } from "@/services/tenants";
import { listContracts } from "@/services/contracts";
import { listPayments } from "@/services/payments";
import { listMaintenanceTickets } from "@/services/maintenance";
import { listMaintenanceInterventions } from "@/services/interventions";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { Contract } from "@/types/contract";
import type { Payment } from "@/types/payment";
import type { MaintenanceTicket } from "@/types/maintenance";
import type { MaintenanceIntervention } from "@/types/intervention";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

function isCurrentMonth(dateValue?: string) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function isCurrentYear(dateValue?: string) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return date.getFullYear() === new Date().getFullYear();
}

function daysUntil(dateValue?: string) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-sobaya-soft">
      <div className="h-full rounded-full bg-sobaya-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export function DashboardOverview() {
  const { organization, member } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!organization?.id) return;
    setLoading(true);
    setLoadError("");
    Promise.all([
      listProperties(organization.id).catch(() => []),
      listTenants(organization.id).catch(() => []),
      listContracts(organization.id).catch(() => []),
      listPayments(organization.id).catch(() => []),
      listMaintenanceTickets(organization.id).catch(() => []),
      listMaintenanceInterventions(organization.id).catch(() => [])
    ]).then(([propertiesData, tenantsData, contractsData, paymentsData, ticketsData, interventionsData]) => {
      setProperties(propertiesData);
      setTenants(tenantsData);
      setContracts(contractsData);
      setPayments(paymentsData);
      setTickets(ticketsData);
      setInterventions(interventionsData);
    }).catch(() => setLoadError("Impossible de charger tous les indicateurs du tableau de bord."))
      .finally(() => setLoading(false));
  }, [organization?.id]);

  const stats = useMemo(() => {
    const activeProperties = properties.filter((item) => item.status !== "archived" && item.isDeleted !== true);
    const occupied = activeProperties.filter((item) => item.status === "occupied").length;
    const vacant = activeProperties.filter((item) => item.status === "available").length;
    const activeTenants = tenants.filter((item) => item.status === "active" && item.isDeleted !== true).length;
    const activeContracts = contracts.filter((item) => item.status === "active" && item.isDeleted !== true);
    const validPayments = payments.filter((item) => item.status !== "cancelled" && item.isDeleted !== true);
    const monthlyRevenue = validPayments.filter((item) => isCurrentMonth(item.paymentDate)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const annualRevenue = validPayments.filter((item) => isCurrentYear(item.paymentDate)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const issuedReceipts = payments.filter((item) => Boolean(item.receiptIssuedAt) && item.isDeleted !== true).length;
    const expectedMonthlyRent = activeContracts.reduce((sum, contract) => sum + Number(contract.monthlyRent || 0) + Number(contract.charges || 0), 0);
    const unpaidBalance = activeContracts.reduce((sum, contract) => sum + Math.max(0, Number(contract.balance || 0)), 0);
    const lateContracts = activeContracts.filter((contract) => contract.nextDueDate && new Date(contract.nextDueDate) < new Date() && Number(contract.balance || 0) > 0);
    const contractsEndingSoon = activeContracts.filter((contract) => {
      const remainingDays = daysUntil(contract.endDate);
      return remainingDays !== null && remainingDays >= 0 && remainingDays <= 30;
    });
    const openTickets = tickets.filter((ticket) => !["resolved", "closed", "cancelled"].includes(ticket.status));
    const urgentTickets = tickets.filter((ticket) => ticket.priority === "urgent" && !["resolved", "closed", "cancelled"].includes(ticket.status));
    const ongoingInterventions = interventions.filter((item) => ["planned", "in_progress"].includes(item.status));
    const completedInterventions = interventions.filter((item) => item.status === "completed");
    const monthlyMaintenanceCost = interventions
      .filter((item) => item.status !== "cancelled" && isCurrentMonth(item.interventionDate))
      .reduce((sum, item) => sum + Number(item.finalCost || item.estimatedCost || 0), 0);
    const annualMaintenanceCost = interventions
      .filter((item) => item.status !== "cancelled" && isCurrentYear(item.interventionDate))
      .reduce((sum, item) => sum + Number(item.finalCost || item.estimatedCost || 0), 0);
    const occupancyRate = activeProperties.length ? Math.round((occupied / activeProperties.length) * 100) : 0;
    const vacancyRate = activeProperties.length ? Math.round((vacant / activeProperties.length) * 100) : 0;
    const monthlyNet = monthlyRevenue - monthlyMaintenanceCost;
    const annualNet = annualRevenue - annualMaintenanceCost;

    const profitabilityByProperty = activeProperties.map((property) => {
      const collected = validPayments.filter((payment) => payment.propertyId === property.id && isCurrentYear(payment.paymentDate)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const maintenance = interventions.filter((item) => item.propertyId === property.id && item.status !== "cancelled" && isCurrentYear(item.interventionDate)).reduce((sum, item) => sum + Number(item.finalCost || item.estimatedCost || 0), 0);
      const activeContract = activeContracts.find((contract) => contract.propertyId === property.id);
      const expectedRent = activeContract ? Number(activeContract.monthlyRent || 0) + Number(activeContract.charges || 0) : Number(property.monthlyRent || 0) + Number(property.charges || 0);
      return { property, collected, maintenance, net: collected - maintenance, expectedRent };
    }).sort((a, b) => b.net - a.net).slice(0, 5);

    const nextActions = [
      ...lateContracts.slice(0, 3).map((contract) => ({ label: `Relancer ${contract.tenantName}`, detail: `${contract.propertyName} · solde ${money(Number(contract.balance || 0))}`, href: "/paiements", tone: "danger" as const })),
      ...contractsEndingSoon.slice(0, 2).map((contract) => ({ label: `Renouveler ${contract.contractNumber}`, detail: `${contract.propertyName} · fin dans ${daysUntil(contract.endDate)} jour(s)`, href: "/contrats", tone: "warning" as const })),
      ...urgentTickets.slice(0, 2).map((ticket) => ({ label: `Traiter ${ticket.title}`, detail: `${ticket.propertyName} · urgence maintenance`, href: "/maintenance", tone: "danger" as const }))
    ].slice(0, 5);

    return {
      activeProperties,
      activeContracts,
      activeTenants,
      monthlyRevenue,
      annualRevenue,
      issuedReceipts,
      lateContracts,
      contractsEndingSoon,
      occupancyRate,
      vacancyRate,
      expectedMonthlyRent,
      unpaidBalance,
      openTickets,
      urgentTickets,
      ongoingInterventions,
      completedInterventions,
      monthlyMaintenanceCost,
      annualMaintenanceCost,
      monthlyNet,
      annualNet,
      registeredPaymentsThisMonth: validPayments.filter((item) => isCurrentMonth(item.paymentDate)).length,
      profitabilityByProperty,
      nextActions
    };
  }, [properties, tenants, contracts, payments, tickets, interventions]);

  return (
    <div className="space-y-5">
      {loadError ? <Card className="border-red-100 bg-red-50 text-sm text-red-700">{loadError}</Card> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Trésorerie du mois" value={money(stats.monthlyNet)} compact helper={`Revenus ${money(stats.monthlyRevenue)} - maintenance ${money(stats.monthlyMaintenanceCost)}`} />
        <MetricCard label="Revenus annuels" value={money(stats.annualRevenue)} compact helper={`Net annuel : ${money(stats.annualNet)}`} />
        <MetricCard label="Taux d'occupation" value={`${stats.occupancyRate}%`} helper={`${stats.activeProperties.length} bien(s) actifs`} />
        <MetricCard label="Impayés" value={money(stats.unpaidBalance)} compact helper={`${stats.lateContracts.length} contrat(s) en retard`} />
      </div>

      <Card className="border-sobaya-primary/15 bg-sobaya-soft/30">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold">Cockpit propriétaire</p>
              <StatusBadge tone={stats.lateContracts.length || stats.urgentTickets.length ? "warning" : "success"}>{loading ? "Actualisation..." : "Pilotage actif"}</StatusBadge>
            </div>
            <p className="mt-1 text-sm leading-6 text-sobaya-muted">Vue synthétique du patrimoine, de la trésorerie, des impayés et de la maintenance.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink href="/rapports" variant="secondary" className="w-full sm:w-fit">États détaillés</ButtonLink>
            <ButtonLink href="/paiements" className="w-full sm:w-fit">Encaisser</ButtonLink>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white p-4">
            <div className="mb-3 flex items-center justify-between"><p className="font-medium">Occupation</p><p className="text-sm text-sobaya-muted">Vacance {stats.vacancyRate}%</p></div>
            <ProgressBar value={stats.occupancyRate} />
            <p className="mt-2 text-sm text-sobaya-muted">{stats.activeContracts.length} contrat(s) actif(s), {stats.activeProperties.length} bien(s) suivis.</p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-4">
            <div className="mb-3 flex items-center justify-between"><p className="font-medium">Recouvrement</p><p className="text-sm text-sobaya-muted">{stats.registeredPaymentsThisMonth} paiement(s)</p></div>
            <ProgressBar value={stats.expectedMonthlyRent ? Math.round((stats.monthlyRevenue / stats.expectedMonthlyRent) * 100) : 0} />
            <p className="mt-2 text-sm text-sobaya-muted">Attendu mensuel : {money(stats.expectedMonthlyRent)}.</p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-4">
            <div className="mb-3 flex items-center justify-between"><p className="font-medium">Maintenance</p><p className="text-sm text-sobaya-muted">{stats.openTickets.length} ouvert(s)</p></div>
            <ProgressBar value={stats.openTickets.length ? Math.max(15, 100 - stats.openTickets.length * 15) : 100} />
            <p className="mt-2 text-sm text-sobaya-muted">{stats.ongoingInterventions.length} intervention(s) en cours.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Biens actifs" value={stats.activeProperties.length} helper="Hors biens archivés" />
        <MetricCard label="Locataires actifs" value={stats.activeTenants} helper="Fiches locataires actives" />
        <MetricCard label="Coût maintenance" value={money(stats.annualMaintenanceCost)} compact helper="Coût annuel enregistré" />
        <MetricCard label="Quittances" value={stats.issuedReceipts} helper="Quittances générées" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2"><PieChart className="text-sobaya-primary" size={20} /><p className="text-lg font-medium">Rentabilité par bien</p></div>
          <div className="grid gap-3">
            {stats.profitabilityByProperty.length === 0 ? <p className="text-sm text-sobaya-muted">Aucune donnée de rentabilité disponible pour le moment.</p> : null}
            {stats.profitabilityByProperty.map((row) => (
              <div key={row.property.id} className="rounded-2xl border border-sobaya-border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{row.property.name}</p>
                    <p className="text-sm text-sobaya-muted">Attendu mensuel : {money(row.expectedRent)}</p>
                  </div>
                  <StatusBadge tone={row.net >= 0 ? "success" : "danger"}>Net {money(row.net)}</StatusBadge>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p>Encaissements : <span className="font-medium">{money(row.collected)}</span></p>
                  <p>Maintenance : <span className="font-medium">{money(row.maintenance)}</span></p>
                  <p>Statut : <span className="font-medium">{row.property.status}</span></p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2"><AlertTriangle className="text-sobaya-primary" size={20} /><p className="text-lg font-medium">Actions prioritaires</p></div>
          <div className="grid gap-3">
            {stats.nextActions.length === 0 ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">Aucune alerte critique à traiter maintenant.</div> : null}
            {stats.nextActions.map((action, index) => (
              <ButtonLink key={`${action.label}-${index}`} href={action.href} variant="secondary" className="justify-between text-left">
                <span>
                  <span className="block font-medium">{action.label}</span>
                  <span className="block text-xs text-sobaya-muted">{action.detail}</span>
                </span>
                <ArrowRight size={16} />
              </ButtonLink>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-start gap-3"><Home className="mt-1 text-sobaya-primary" size={20} /><div><p className="text-lg font-medium">Patrimoine</p><p className="mt-2 text-sm leading-6 text-sobaya-muted">Organisation : <span className="text-sobaya-ink">{organization?.name}</span>. Rôle : <span className="text-sobaya-ink">{member?.role}</span>.</p></div></div>
          <div className="mt-4"><ButtonLink href="/biens">Gérer les biens</ButtonLink></div>
        </Card>
        <Card>
          <div className="flex items-start gap-3"><ReceiptText className="mt-1 text-sobaya-primary" size={20} /><div><p className="text-lg font-medium">Contrats & quittances</p><p className="mt-2 text-sm leading-6 text-sobaya-muted">Suivez les contrats, encaissements, quittances PDF et QR codes publics.</p></div></div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row"><ButtonLink href="/contrats" variant="secondary">Contrats</ButtonLink><ButtonLink href="/paiements" variant="secondary"><CreditCard size={16} /> Paiements</ButtonLink></div>
        </Card>
        <Card>
          <div className="flex items-start gap-3"><Wrench className="mt-1 text-sobaya-primary" size={20} /><div><p className="text-lg font-medium">Maintenance</p><p className="mt-2 text-sm leading-6 text-sobaya-muted">{stats.openTickets.length} ticket(s) ouvert(s), {stats.completedInterventions.length} intervention(s) terminée(s).</p></div></div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row"><ButtonLink href="/maintenance" variant="secondary">Tickets</ButtonLink><ButtonLink href="/interventions" variant="secondary"><CalendarClock size={16} /> Interventions</ButtonLink></div>
        </Card>
      </div>
    </div>
  );
}
