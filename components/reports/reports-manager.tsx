"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, PieChart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { listContracts } from "@/services/contracts";
import { listMaintenanceInterventions } from "@/services/interventions";
import { listPayments } from "@/services/payments";
import { listProperties } from "@/services/properties";
import { buildMonthlyReport, buildPropertyReport, defaultReportPeriod, type ReportPeriod } from "@/services/reports";
import type { Contract } from "@/types/contract";
import type { MaintenanceIntervention } from "@/types/intervention";
import type { Payment } from "@/types/payment";
import type { Property } from "@/types/property";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

function percent(value: number) {
  return `${Math.round(value || 0)}%`;
}

function csvEscape(value: string | number) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadTextFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ReportsManager() {
  const { organization } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>(() => defaultReportPeriod());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [propertiesData, contractsData, paymentsData, interventionsData] = await Promise.all([
        listProperties(organization.id),
        listContracts(organization.id),
        listPayments(organization.id),
        listMaintenanceInterventions(organization.id).catch(() => [])
      ]);
      setProperties(propertiesData);
      setContracts(contractsData);
      setPayments(paymentsData);
      setInterventions(interventionsData);
    } catch {
      setError("Impossible de charger les états. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const reports = useMemo(() => {
    const propertyRows = buildPropertyReport({ properties, contracts, payments, interventions, period });
    const monthlyRows = buildMonthlyReport({ payments, interventions, period });
    const activeProperties = properties.filter((property) => property.status !== "archived");
    const occupiedProperties = activeProperties.filter((property) => property.status === "occupied").length;
    const vacantProperties = activeProperties.filter((property) => property.status === "available").length;
    const collected = propertyRows.reduce((sum, row) => sum + row.collected, 0);
    const expectedMonthly = propertyRows.reduce((sum, row) => sum + row.expectedRent, 0);
    const maintenanceCost = propertyRows.reduce((sum, row) => sum + row.maintenanceCost, 0);
    const netRevenue = collected - maintenanceCost;
    const occupancyRate = activeProperties.length ? (occupiedProperties / activeProperties.length) * 100 : 0;
    const vacancyRate = activeProperties.length ? (vacantProperties / activeProperties.length) * 100 : 0;
    const activeContracts = contracts.filter((contract) => contract.status === "active" && contract.isDeleted !== true);
    const unpaidBalance = activeContracts.reduce((sum, contract) => sum + Number(contract.balance || 0), 0);
    return { propertyRows, monthlyRows, activeProperties, collected, expectedMonthly, maintenanceCost, netRevenue, occupancyRate, vacancyRate, unpaidBalance };
  }, [contracts, interventions, payments, period, properties]);

  function exportPropertyCsv() {
    const headers = ["Bien", "Occupation", "Loyer attendu", "Encaissements", "Coût maintenance", "Résultat net"];
    const lines = reports.propertyRows.map((row) => [row.propertyName, row.occupancy, row.expectedRent, row.collected, row.maintenanceCost, row.netRevenue].map(csvEscape).join(";"));
    downloadTextFile(`sobaya-etats-par-bien-${period.startDate}-${period.endDate}.csv`, [headers.map(csvEscape).join(";"), ...lines].join("\n"));
  }

  function exportMonthlyCsv() {
    const headers = ["Mois", "Paiements", "Encaissements", "Coût maintenance", "Résultat net"];
    const lines = reports.monthlyRows.map((row) => [row.label, row.paymentsCount, row.collected, row.maintenanceCost, row.netRevenue].map(csvEscape).join(";"));
    downloadTextFile(`sobaya-etats-mensuels-${period.startDate}-${period.endDate}.csv`, [headers.map(csvEscape).join(";"), ...lines].join("\n"));
  }

  function openPrintableReport() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Rapport SOBAYA</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#18231f}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #d8ded9;padding:8px;text-align:left}th{background:#f3f7f4}.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{border:1px solid #d8ded9;border-radius:12px;padding:12px}.muted{color:#66736b}</style></head><body><h1>Rapport SOBAYA</h1><p class="muted">${organization?.name ?? "Organisation"} · Du ${period.startDate} au ${period.endDate}</p><div class="kpi"><div class="card"><strong>${money(reports.collected)}</strong><br><span>Encaissements</span></div><div class="card"><strong>${percent(reports.occupancyRate)}</strong><br><span>Occupation</span></div><div class="card"><strong>${money(reports.unpaidBalance)}</strong><br><span>Impayés</span></div><div class="card"><strong>${money(reports.netRevenue)}</strong><br><span>Résultat net</span></div></div><h2>Rapport par bien</h2><table><thead><tr><th>Bien</th><th>Occupation</th><th>Loyer attendu</th><th>Encaissements</th><th>Maintenance</th><th>Net</th></tr></thead><tbody>${reports.propertyRows.map((row) => `<tr><td>${row.propertyName}</td><td>${row.occupancy}</td><td>${money(row.expectedRent)}</td><td>${money(row.collected)}</td><td>${money(row.maintenanceCost)}</td><td>${money(row.netRevenue)}</td></tr>`).join("")}</tbody></table><h2>Rapport mensuel</h2><table><thead><tr><th>Mois</th><th>Paiements</th><th>Encaissements</th><th>Maintenance</th><th>Net</th></tr></thead><tbody>${reports.monthlyRows.map((row) => `<tr><td>${row.label}</td><td>${row.paymentsCount}</td><td>${money(row.collected)}</td><td>${money(row.maintenanceCost)}</td><td>${money(row.netRevenue)}</td></tr>`).join("")}</tbody></table><script>window.print()</script></body></html>`;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="États & Reporting" description="Analysez les revenus, l&apos;occupation, les impayés et la performance par bien." />

      <Card className="border-sobaya-primary/15 bg-sobaya-soft/30">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-sobaya-ink">Début<Input type="date" className="mt-2" value={period.startDate} onChange={(event) => setPeriod((current) => ({ ...current, startDate: event.target.value }))} /></label>
            <label className="text-sm font-medium text-sobaya-ink">Fin<Input type="date" className="mt-2" value={period.endDate} onChange={(event) => setPeriod((current) => ({ ...current, endDate: event.target.value }))} /></label>
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Actualiser</Button>
        </div>
      </Card>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenus période" value={money(reports.collected)} compact helper="Paiements hors annulations" />
        <MetricCard label="Occupation" value={percent(reports.occupancyRate)} helper={`${reports.activeProperties.length} bien(s) actifs`} />
        <MetricCard label="Vacance locative" value={percent(reports.vacancyRate)} helper="Biens disponibles" />
        <MetricCard label="Résultat net" value={money(reports.netRevenue)} compact helper="Revenus - maintenance" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Loyer mensuel attendu" value={money(reports.expectedMonthly)} compact helper="Contrats actifs" />
        <MetricCard label="Impayés déclarés" value={money(reports.unpaidBalance)} compact helper="Soldes des contrats actifs" />
        <MetricCard label="Coût maintenance" value={money(reports.maintenanceCost)} compact helper="Interventions de la période" />
        <MetricCard label="Mois analysés" value={reports.monthlyRows.length} helper="Période sélectionnée" />
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2"><PieChart size={19} className="text-sobaya-primary" /><p className="text-lg font-medium">Rapport par bien</p></div>
            <p className="mt-1 text-sm text-sobaya-muted">Comparez encaissements, maintenance et rentabilité nette par bien.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={exportPropertyCsv}><FileSpreadsheet size={16} /> Export Excel</Button>
            <Button variant="secondary" onClick={openPrintableReport}><FileText size={16} /> Export PDF</Button>
          </div>
        </div>
        {loading ? <p className="text-sm text-sobaya-muted">Chargement des états...</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-sobaya-border text-sobaya-muted">
              <tr><th className="py-3 pr-4 font-medium">Bien</th><th className="py-3 pr-4 font-medium">Occupation</th><th className="py-3 pr-4 font-medium">Loyer attendu</th><th className="py-3 pr-4 font-medium">Encaissements</th><th className="py-3 pr-4 font-medium">Maintenance</th><th className="py-3 pr-4 font-medium">Net</th></tr>
            </thead>
            <tbody>
              {reports.propertyRows.map((row) => (
                <tr key={row.propertyId} className="border-b border-sobaya-border/70">
                  <td className="py-3 pr-4 font-medium">{row.propertyName}</td>
                  <td className="py-3 pr-4"><StatusBadge tone={row.occupancy === "occupé" ? "success" : row.occupancy === "disponible" ? "warning" : "neutral"}>{row.occupancy}</StatusBadge></td>
                  <td className="py-3 pr-4">{money(row.expectedRent)}</td>
                  <td className="py-3 pr-4">{money(row.collected)}</td>
                  <td className="py-3 pr-4">{money(row.maintenanceCost)}</td>
                  <td className="py-3 pr-4 font-medium">{money(row.netRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2"><Download size={19} className="text-sobaya-primary" /><p className="text-lg font-medium">Rapport mensuel</p></div>
            <p className="mt-1 text-sm text-sobaya-muted">Suivez l&apos;évolution des encaissements et des coûts sur la période.</p>
          </div>
          <Button variant="secondary" onClick={exportMonthlyCsv}><FileSpreadsheet size={16} /> Export mensuel</Button>
        </div>
        <div className="grid gap-3">
          {reports.monthlyRows.length === 0 && !loading ? <p className="text-sm text-sobaya-muted">Aucune donnée financière sur la période sélectionnée.</p> : null}
          {reports.monthlyRows.map((row) => (
            <div key={row.monthKey} className="grid gap-2 rounded-2xl border border-sobaya-border p-4 md:grid-cols-5 md:items-center">
              <p className="font-medium capitalize">{row.label}</p>
              <p className="text-sm text-sobaya-muted">{row.paymentsCount} paiement(s)</p>
              <p className="text-sm">Revenus : {money(row.collected)}</p>
              <p className="text-sm">Maintenance : {money(row.maintenanceCost)}</p>
              <p className="text-sm font-medium">Net : {money(row.netRevenue)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
