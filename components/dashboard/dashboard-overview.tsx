"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Building2, CalendarClock, CreditCard, FileText, Home, ReceiptText, UserRoundCheck, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { GlobalSearch } from "@/components/layout/global-search";
import { useAuth } from "@/components/providers/auth-provider";
import { listProperties } from "@/services/properties";
import { listTenants } from "@/services/tenants";
import { listContracts } from "@/services/contracts";
import { listPayments } from "@/services/payments";
import { listMaintenanceTickets } from "@/services/maintenance";
import { listMaintenanceInterventions } from "@/services/interventions";
import { listOwnerMandates } from "@/services/owner-mandates";
import { computeRentSituations } from "@/services/rent-arrears";
import { computePropertySituation } from "@/services/property-situation";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { Contract } from "@/types/contract";
import type { Payment } from "@/types/payment";
import type { MaintenanceTicket } from "@/types/maintenance";
import type { MaintenanceIntervention } from "@/types/intervention";
import type { OwnerMandate } from "@/types/owner-mandate";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

function isCurrentMonth(dateValue?: string) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function daysUntil(dateValue?: string) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function computeManagementFee(amount: number, feeType?: string, feeValue?: number) {
  if (feeType === "percentage") return Math.round((amount * Number(feeValue || 0)) / 100);
  if (feeType === "fixed") return Number(feeValue || 0);
  return 0;
}

function dashboardTitle(organizationType?: string, globalRole?: string) {
  if (globalRole === "super_admin") return "Dashboard Master Super Admin";
  if (organizationType === "agency") return "Dashboard Master Agence";
  if (organizationType === "real_estate_agent") return "Dashboard Master Agent";
  return "Dashboard Master Propriétaire";
}

export function DashboardOverview() {
  const { organization, profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>([]);
  const [ownerMandates, setOwnerMandates] = useState<OwnerMandate[]>([]);
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
      listMaintenanceInterventions(organization.id).catch(() => []),
      listOwnerMandates(organization.id).catch(() => [])
    ]).then(([propertiesData, tenantsData, contractsData, paymentsData, ticketsData, interventionsData, ownerMandatesData]) => {
      setProperties(propertiesData);
      setTenants(tenantsData);
      setContracts(contractsData);
      setPayments(paymentsData);
      setTickets(ticketsData);
      setInterventions(interventionsData);
      setOwnerMandates(ownerMandatesData);
    }).catch(() => setLoadError("Impossible de charger tous les indicateurs du tableau de bord."))
      .finally(() => setLoading(false));
  }, [organization?.id]);

  const stats = useMemo(() => {
    const activeProperties = properties.filter((item) => item.status !== "archived" && item.isDeleted !== true);
    const activeContracts = contracts.filter((item) => item.status === "active" && item.isDeleted !== true);
    const validPayments = payments.filter((item) => item.status !== "cancelled" && item.isDeleted !== true);
    const situations = activeProperties.map((property) => computePropertySituation(property, activeContracts));
    const occupied = situations.filter((item) => item.dashboardBucket === "occupied").length;
    const available = situations.filter((item) => item.dashboardBucket === "available").length;
    const withdrawn = situations.filter((item) => item.dashboardBucket === "withdrawn").length;
    const maintenanceProperties = situations.filter((item) => item.dashboardBucket === "maintenance").length;
    const rentSituations = computeRentSituations(activeContracts, validPayments);
    const lateSituations = rentSituations.filter((situation) => situation.status === "late" || situation.status === "partial");
    const unpaidBalance = rentSituations.reduce((sum, situation) => sum + situation.totalDue, 0);
    const monthlyRevenue = validPayments.filter((item) => isCurrentMonth(item.paymentDate)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const contractsEndingSoon = activeContracts.filter((contract) => {
      const remainingDays = daysUntil(contract.endDate);
      return remainingDays !== null && remainingDays >= 0 && remainingDays <= 30;
    });
    const urgentTickets = tickets.filter((ticket) => ticket.priority === "urgent" && !["resolved", "closed", "cancelled"].includes(ticket.status));
    const openTickets = tickets.filter((ticket) => !["resolved", "closed", "cancelled"].includes(ticket.status));
    const agencyCollected = validPayments.filter((payment) => payment.ownerMandateId).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const agencyCommission = validPayments.reduce((sum, payment) => {
      if (typeof payment.agencyCommissionAmount === "number") return sum + Number(payment.agencyCommissionAmount || 0);
      const contract = activeContracts.find((item) => item.id === payment.contractId);
      return sum + computeManagementFee(Number(payment.amount || 0), contract?.managementFeeType, contract?.managementFeeValue);
    }, 0);
    const recentPayments = validPayments.slice(0, 3).map((payment) => ({ label: payment.tenantName || "Paiement", detail: `${payment.receiptNumber || "Reçu"} · ${money(Number(payment.amount || 0))}`, href: "/paiements" }));
    const recentContracts = activeContracts.slice(0, 2).map((contract) => ({ label: contract.contractNumber, detail: `${contract.tenantName} · ${contract.propertyName}`, href: "/contrats" }));
    const recentReminders = lateSituations.slice(0, 2).map((situation) => ({ label: `Relance ${situation.tenantName}`, detail: `${situation.dueMonths.length} mois dû(s) · ${money(situation.totalDue)}`, href: "/impayes" }));
    return {
      occupied,
      available,
      withdrawn,
      maintenanceProperties,
      activeProperties: activeProperties.length,
      activeTenants: tenants.filter((item) => item.status === "active" && item.isDeleted !== true).length,
      activeContracts,
      monthlyRevenue,
      unpaidBalance,
      contractsEndingSoon,
      urgentTickets,
      openTickets,
      agencyCollected,
      agencyCommission,
      ownerPayout: Math.max(0, agencyCollected - agencyCommission),
      ownerMandates: ownerMandates.filter((item) => item.status === "active" && item.isDeleted !== true).length,
      recentActivity: [...recentPayments, ...recentContracts, ...recentReminders].slice(0, 6)
    };
  }, [contracts, ownerMandates, payments, properties, tenants, tickets]);

  if (loading) return <Card>Chargement du tableau de bord...</Card>;

  return (
    <div className="space-y-4 sm:space-y-5">
      {loadError ? <Card className="border-red-100 bg-red-50 text-sm text-red-700">{loadError}</Card> : null}

      <Card className="border-sobaya-primary/15 bg-sobaya-soft/30">
        <div className="grid gap-4 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-semibold">{dashboardTitle(organization?.type, profile?.globalRole)}</p>
              <StatusBadge tone={stats.unpaidBalance || stats.urgentTickets.length ? "warning" : "success"}>Vue simplifiée</StatusBadge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-sobaya-muted">Un tableau de bord plus léger : priorités immédiates, finances, patrimoine et activité récente. Les détails restent disponibles dans les sections repliables et les cartes actionnables.</p>
          </div>
          <GlobalSearch />
        </div>
      </Card>

      <CollapsibleSection title="Priorités" description="À traiter avant le reste : impayés, contrats à renouveler, maintenance urgente." defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Impayés" value={money(stats.unpaidBalance)} compact helper="Arriérés locatifs actifs" href="/impayes" />
          <MetricCard label="Contrats à renouveler" value={stats.contractsEndingSoon.length} helper="Échéance dans 30 jours" href="/contrats" />
          <MetricCard label="Maintenance urgente" value={stats.urgentTickets.length} helper={`${stats.openTickets.length} ticket(s) ouvert(s)`} href="/maintenance" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Finances" description="Encaissements, arriérés, commissions et reversements estimés." defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Encaissements" value={money(stats.monthlyRevenue)} compact helper="Mois en cours" href="/paiements?periode=mois" />
          <MetricCard label="Arriérés" value={money(stats.unpaidBalance)} compact helper="Solde à recouvrer" href="/impayes" />
          <MetricCard label="Commissions" value={money(stats.agencyCommission)} compact helper="Agence / mandats" href="/rapports?vue=commissions" />
          <MetricCard label="Reversements" value={money(stats.ownerPayout)} compact helper="Mandants estimés" href="/rapports?vue=reversements" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Patrimoine" description="État opérationnel des biens sans surcharge visuelle." defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Occupés" value={stats.occupied} helper="Biens loués" href="/biens?etat=occupied" />
          <MetricCard label="Disponibles" value={stats.available} helper="Biens louables" href="/biens?etat=available" />
          <MetricCard label="Retirés du marché" value={stats.withdrawn} helper="Non proposés" href="/biens?etat=withdrawn" />
          <MetricCard label="Maintenance" value={stats.maintenanceProperties} helper="Bloqués/travaux" href="/biens?etat=maintenance" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Activité récente" description="Paiements, contrats et relances utiles sans flux trop envahissant." defaultOpen={false}>
        {stats.recentActivity.length === 0 ? <p className="text-sm text-sobaya-muted">Aucune activité récente à afficher.</p> : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {stats.recentActivity.map((item, index) => (
            <ButtonLink key={`${item.label}-${index}`} href={item.href} variant="secondary" className="justify-between text-left">
              <span><span className="block font-medium">{item.label}</span><span className="block text-xs text-sobaya-muted">{item.detail}</span></span>
              <ArrowRight size={16} />
            </ButtonLink>
          ))}
        </div>
      </CollapsibleSection>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-4">
        <Card><div className="flex items-start gap-3"><Home className="mt-1 text-sobaya-primary" size={20} /><div><p className="font-medium">Gestion locative</p><p className="mt-2 text-sm text-sobaya-muted">{stats.activeProperties} bien(s), {stats.activeTenants} locataire(s), {stats.activeContracts.length} contrat(s).</p><div className="mt-4"><ButtonLink href="/biens" variant="secondary">Ouvrir</ButtonLink></div></div></div></Card>
        <Card><div className="flex items-start gap-3"><CreditCard className="mt-1 text-sobaya-primary" size={20} /><div><p className="font-medium">Finances</p><p className="mt-2 text-sm text-sobaya-muted">Encaissements et relances centralisés.</p><div className="mt-4"><ButtonLink href="/paiements" variant="secondary">Paiements</ButtonLink></div></div></div></Card>
        <Card><div className="flex items-start gap-3"><UserRoundCheck className="mt-1 text-sobaya-primary" size={20} /><div><p className="font-medium">Mandants</p><p className="mt-2 text-sm text-sobaya-muted">{stats.ownerMandates} propriétaire(s) actif(s).</p><div className="mt-4"><ButtonLink href="/proprietaires" variant="secondary">Mandants</ButtonLink></div></div></div></Card>
        <Card><div className="flex items-start gap-3"><Wrench className="mt-1 text-sobaya-primary" size={20} /><div><p className="font-medium">Exploitation</p><p className="mt-2 text-sm text-sobaya-muted">Maintenance, prestataires et interventions.</p><div className="mt-4"><ButtonLink href="/maintenance" variant="secondary">Maintenance</ButtonLink></div></div></div></Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-medium">Préparation UX globale V1</p>
            <p className="mt-2 text-sm leading-6 text-sobaya-muted">Le dashboard est maintenant organisé pour l’audit écran par écran : menu hiérarchique, recherche, blocs repliables, cartes actionnables et parcours mobile.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink href="/rapports" variant="secondary"><FileText size={16} /> Rapports</ButtonLink>
            <ButtonLink href="/notifications" variant="secondary"><ReceiptText size={16} /> Notifications</ButtonLink>
            <ButtonLink href="/interventions" variant="secondary"><CalendarClock size={16} /> Interventions</ButtonLink>
          </div>
        </div>
      </Card>
    </div>
  );
}
