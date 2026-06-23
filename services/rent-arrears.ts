import type { Contract } from "@/types/contract";
import type { Payment } from "@/types/payment";
import { expectedMonthlyPayment, formatCoveredPeriod } from "@/services/business-rules";

export type RentMonthStatus = "paid" | "partial" | "unpaid";

export interface RentMonthLine {
  key: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: RentMonthStatus;
}

export interface RentSituation {
  contractId: string;
  tenantName: string;
  propertyName: string;
  monthlyAmount: number;
  totalExpected: number;
  totalPaid: number;
  initialBalance: number;
  totalDue: number;
  unpaidMonthsCount: number;
  partialMonthsCount: number;
  paidMonthsCount: number;
  advanceMonthsCount: number;
  status: "up_to_date" | "late" | "partial" | "advance" | "inactive";
  lastPaidLabel: string;
  nextPeriodStart: string;
  nextPeriodEnd: string;
  nextPeriodLabel: string;
  dueMonths: RentMonthLine[];
  monthLines: RentMonthLine[];
}

function safeDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}

function monthsBetween(start: Date, end: Date) {
  const months: Date[] = [];
  const cursor = monthStart(start);
  const limit = monthStart(end);
  while (cursor <= limit) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function getTrackingStart(contract: Contract) {
  const migrationEnd = safeDate(contract.migrationLastPaidPeriodEnd);
  if (contract.onboardingMode === "existing" && migrationEnd) return addMonths(migrationEnd, 1);
  const start = safeDate(contract.startDate) ?? new Date();
  return monthStart(start);
}

function allocatePayments(contract: Contract, payments: Payment[], trackingStart: Date, today: Date) {
  const paidByMonth = new Map<string, number>();
  const monthlyAmount = expectedMonthlyPayment(contract);
  const validPayments = payments
    .filter((payment) => payment.contractId === contract.id && payment.isDeleted !== true && payment.status !== "cancelled")
    .sort((a, b) => (a.periodStart || a.paymentDate || "").localeCompare(b.periodStart || b.paymentDate || ""));

  for (const payment of validPayments) {
    const start = safeDate(payment.periodStart || payment.paymentDate);
    const end = safeDate(payment.periodEnd || payment.periodStart || payment.paymentDate);
    if (!start || !end) continue;
    const coveredMonths = monthsBetween(start, end);
    let remaining = Number(payment.amount || 0);
    for (const month of coveredMonths) {
      if (remaining <= 0) break;
      const key = dateKey(month);
      const expected = monthlyAmount || Number(payment.expectedAmount || 0) || remaining;
      const alreadyPaid = paidByMonth.get(key) ?? 0;
      const allocatable = Math.max(expected - alreadyPaid, 0);
      const allocated = Math.min(remaining, allocatable || remaining);
      paidByMonth.set(key, alreadyPaid + allocated);
      remaining -= allocated;
    }
    if (remaining > 0 && coveredMonths.length > 0) {
      const lastKey = dateKey(coveredMonths[coveredMonths.length - 1]);
      paidByMonth.set(lastKey, (paidByMonth.get(lastKey) ?? 0) + remaining);
    }
  }

  // Le dernier paiement avant SOBAYA sert de point de reprise : les mois avant trackingStart ne sont pas recalculés.
  return paidByMonth;
}

export function computeRentSituation(contract: Contract, payments: Payment[], today = new Date()): RentSituation {
  const monthlyAmount = expectedMonthlyPayment(contract);
  const trackingStart = getTrackingStart(contract);
  const contractEnd = safeDate(contract.endDate);
  const currentMonth = monthStart(today);
  const limit = contractEnd && contractEnd < currentMonth ? monthStart(contractEnd) : currentMonth;
  const expectedMonths = contract.status === "active" && monthlyAmount > 0 && trackingStart <= limit ? monthsBetween(trackingStart, limit) : [];
  const paidByMonth = allocatePayments(contract, payments, trackingStart, today);
  const initialBalance = Math.max(Number(contract.migrationBalance || 0), 0);

  const monthLines = expectedMonths.map((month) => {
    const key = dateKey(month);
    const paidAmount = paidByMonth.get(key) ?? 0;
    const remainingAmount = Math.max(monthlyAmount - paidAmount, 0);
    const status: RentMonthStatus = remainingAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
    return {
      key,
      label: monthLabel(month),
      periodStart: iso(monthStart(month)),
      periodEnd: iso(monthEnd(month)),
      expectedAmount: monthlyAmount,
      paidAmount,
      remainingAmount,
      status
    };
  });

  const dueMonths = monthLines.filter((line) => line.status !== "paid");
  const totalExpected = monthLines.reduce((sum, line) => sum + line.expectedAmount, 0) + initialBalance;
  const totalPaid = monthLines.reduce((sum, line) => sum + Math.min(line.paidAmount, line.expectedAmount), 0);
  const totalDue = dueMonths.reduce((sum, line) => sum + line.remainingAmount, 0) + initialBalance;
  const paidMonthsCount = monthLines.filter((line) => line.status === "paid").length;
  const partialMonthsCount = monthLines.filter((line) => line.status === "partial").length;
  const unpaidMonthsCount = monthLines.filter((line) => line.status === "unpaid").length;

  const paidKeys = Array.from(paidByMonth.entries()).filter(([, amount]) => amount > 0).map(([key]) => key).sort();
  const lastPaidKey = paidKeys[paidKeys.length - 1];
  const lastPaidDate = lastPaidKey ? new Date(`${lastPaidKey}-01`) : safeDate(contract.migrationLastPaidPeriodEnd);
  const lastPaidLabel = lastPaidDate ? monthLabel(lastPaidDate) : "Aucun mois payé détecté";

  const firstDue = dueMonths[0];
  const nextDate = firstDue ? new Date(firstDue.periodStart) : addMonths(lastPaidDate ? monthStart(lastPaidDate) : limit, 1);
  const advanceMonthsCount = Math.max(0, Math.round(((lastPaidDate ? monthStart(lastPaidDate).getFullYear() - currentMonth.getFullYear() : 0) * 12) + ((lastPaidDate ? monthStart(lastPaidDate).getMonth() : currentMonth.getMonth()) - currentMonth.getMonth())));

  const status: RentSituation["status"] = contract.status !== "active"
    ? "inactive"
    : totalDue > 0 && partialMonthsCount > 0
      ? "partial"
      : totalDue > 0
        ? "late"
        : advanceMonthsCount > 0
          ? "advance"
          : "up_to_date";

  return {
    contractId: contract.id,
    tenantName: contract.tenantName,
    propertyName: contract.propertyName,
    monthlyAmount,
    totalExpected,
    totalPaid,
    initialBalance,
    totalDue,
    unpaidMonthsCount,
    partialMonthsCount,
    paidMonthsCount,
    advanceMonthsCount,
    status,
    lastPaidLabel,
    nextPeriodStart: iso(monthStart(nextDate)),
    nextPeriodEnd: iso(monthEnd(nextDate)),
    nextPeriodLabel: formatCoveredPeriod(iso(monthStart(nextDate)), iso(monthEnd(nextDate))),
    dueMonths,
    monthLines
  };
}

export function computeRentSituations(contracts: Contract[], payments: Payment[], today = new Date()) {
  return contracts
    .filter((contract) => contract.isDeleted !== true)
    .map((contract) => computeRentSituation(contract, payments, today));
}
