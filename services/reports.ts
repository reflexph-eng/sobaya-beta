import type { Contract } from "@/types/contract";
import type { MaintenanceIntervention } from "@/types/intervention";
import type { Payment } from "@/types/payment";
import type { Property } from "@/types/property";
import { computePropertySituation } from "@/services/property-situation";

export type ReportPeriod = {
  startDate: string;
  endDate: string;
};

export type PropertyReportRow = {
  propertyId: string;
  propertyName: string;
  status: string;
  expectedRent: number;
  collected: number;
  maintenanceCost: number;
  netRevenue: number;
  occupancy: "occupé" | "disponible" | "maintenance" | "retiré" | "archivé";
};

export type MonthlyReportRow = {
  monthKey: string;
  label: string;
  collected: number;
  paymentsCount: number;
  maintenanceCost: number;
  netRevenue: number;
};

function asDate(value?: string) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function isInsidePeriod(value: string | undefined, period: ReportPeriod) {
  const date = asDate(value);
  const start = asDate(period.startDate);
  const end = asDate(period.endDate);
  if (!date || !start || !end) return false;
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

function monthKey(value: string) {
  const date = asDate(value) ?? new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function propertySituationLabel(property: Property, contracts: Contract[]): PropertyReportRow["occupancy"] {
  if (property.status === "archived") return "archivé";
  const situation = computePropertySituation(property, contracts);
  if (situation.dashboardBucket === "occupied") return "occupé";
  if (situation.dashboardBucket === "maintenance") return "maintenance";
  if (situation.dashboardBucket === "withdrawn") return "retiré";
  return "disponible";
}

export function buildPropertyReport({ properties, contracts, payments, interventions, period }: { properties: Property[]; contracts: Contract[]; payments: Payment[]; interventions: MaintenanceIntervention[]; period: ReportPeriod; }): PropertyReportRow[] {
  const validPayments = payments.filter((payment) => payment.status !== "cancelled" && isInsidePeriod(payment.paymentDate, period));
  const validInterventions = interventions.filter((item) => item.status !== "cancelled" && isInsidePeriod(item.interventionDate, period));
  return properties
    .filter((property) => property.status !== "archived")
    .map((property) => {
      const activeContract = contracts.find((contract) => contract.propertyId === property.id && contract.status === "active" && contract.isDeleted !== true);
      const expectedRent = activeContract ? (Number(activeContract.monthlyRent) || 0) + (Number(activeContract.charges) || 0) : 0;
      const collected = validPayments.filter((payment) => payment.propertyId === property.id).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const maintenanceCost = validInterventions.filter((item) => item.propertyId === property.id).reduce((sum, item) => sum + Number(item.finalCost || item.estimatedCost || 0), 0);
      return {
        propertyId: property.id,
        propertyName: property.name,
        status: property.status,
        expectedRent,
        collected,
        maintenanceCost,
        netRevenue: collected - maintenanceCost,
        occupancy: propertySituationLabel(property, contracts)
      };
    })
    .sort((a, b) => b.collected - a.collected);
}

export function buildMonthlyReport({ payments, interventions, period }: { payments: Payment[]; interventions: MaintenanceIntervention[]; period: ReportPeriod; }): MonthlyReportRow[] {
  const rows = new Map<string, MonthlyReportRow>();
  const validPayments = payments.filter((payment) => payment.status !== "cancelled" && isInsidePeriod(payment.paymentDate, period));
  const validInterventions = interventions.filter((item) => item.status !== "cancelled" && isInsidePeriod(item.interventionDate, period));

  for (const payment of validPayments) {
    const key = monthKey(payment.paymentDate);
    const row = rows.get(key) ?? { monthKey: key, label: monthLabel(key), collected: 0, paymentsCount: 0, maintenanceCost: 0, netRevenue: 0 };
    row.collected += Number(payment.amount || 0);
    row.paymentsCount += 1;
    row.netRevenue = row.collected - row.maintenanceCost;
    rows.set(key, row);
  }

  for (const intervention of validInterventions) {
    const key = monthKey(intervention.interventionDate);
    const row = rows.get(key) ?? { monthKey: key, label: monthLabel(key), collected: 0, paymentsCount: 0, maintenanceCost: 0, netRevenue: 0 };
    row.maintenanceCost += Number(intervention.finalCost || intervention.estimatedCost || 0);
    row.netRevenue = row.collected - row.maintenanceCost;
    rows.set(key, row);
  }

  return Array.from(rows.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function defaultReportPeriod(): ReportPeriod {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10)
  };
}
