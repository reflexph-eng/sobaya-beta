"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type { Contract } from "@/types/contract";
import type { Payment, PaymentFormValues, PaymentMethod } from "@/types/payment";
import { computePaymentBalance, computePaymentStatus, expectedMonthlyPayment, expectedPaymentForPeriod, formatCoveredPeriod, isActiveContract } from "@/services/business-rules";
import { computeRentSituation } from "@/services/rent-arrears";

const methods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Espèces" },
  { value: "orange_money", label: "Orange Money" },
  { value: "wave", label: "Wave" },
  { value: "bank_transfer", label: "Virement" },
  { value: "check", label: "Chèque" },
  { value: "other", label: "Autre" }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function monthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

const initialValues: PaymentFormValues = {
  contractId: "",
  paymentDate: today(),
  periodStart: monthStart(),
  periodEnd: monthEnd(),
  amount: 0,
  paymentMethod: "cash",
  reference: "",
  status: "completed",
  notes: ""
};

export function PaymentForm({ payment, contracts, payments = [], initialContractId, loading, onSubmit, onCancel }: {
  payment?: Payment | null;
  contracts: Contract[];
  payments?: Payment[];
  initialContractId?: string;
  loading?: boolean;
  onSubmit: (values: PaymentFormValues) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const activeContracts = useMemo(() => contracts.filter(isActiveContract), [contracts]);
  const [values, setValues] = useState<PaymentFormValues>(initialValues);
  const [error, setError] = useState("");
  const selectedContract = contracts.find((contract) => contract.id === values.contractId);
  const monthlyAmount = expectedMonthlyPayment(selectedContract);
  const expectedAmount = expectedPaymentForPeriod(selectedContract, values.periodStart, values.periodEnd);
  const periodLabel = formatCoveredPeriod(values.periodStart, values.periodEnd);
  const calculatedStatus = computePaymentStatus(Number(values.amount) || 0, expectedAmount);
  const balance = computePaymentBalance(Number(values.amount) || 0, expectedAmount);
  const rentSituation = selectedContract ? computeRentSituation(selectedContract, payments.filter((item) => item.id !== payment?.id)) : null;

  useEffect(() => {
    if (payment) {
      const start = payment.periodStart || payment.paymentDate || monthStart();
      const end = payment.periodEnd || payment.paymentDate || monthEnd();
      setValues({
        contractId: payment.contractId,
        paymentDate: payment.paymentDate,
        periodStart: start,
        periodEnd: end,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        reference: payment.reference,
        status: payment.status,
        notes: payment.notes
      });
    } else {
      const defaultContract = contracts.find((contract) => contract.id === initialContractId) ?? activeContracts[0] ?? contracts[0];
      const situation = defaultContract ? computeRentSituation(defaultContract, payments) : null;
      const start = situation?.nextPeriodStart ?? monthStart();
      const end = situation?.nextPeriodEnd ?? monthEnd();
      const defaultExpectedAmount = expectedPaymentForPeriod(defaultContract, start, end);
      setValues({
        ...initialValues,
        periodStart: start,
        periodEnd: end,
        contractId: defaultContract?.id ?? "",
        amount: defaultExpectedAmount,
        status: computePaymentStatus(defaultExpectedAmount, defaultExpectedAmount)
      });
    }
  }, [payment, contracts, activeContracts, payments, initialContractId]);

  function recompute(next: Partial<PaymentFormValues>) {
    setValues((current) => {
      const merged = { ...current, ...next };
      const contract = contracts.find((item) => item.id === merged.contractId);
      const situation = contract ? computeRentSituation(contract, payments.filter((item) => item.id !== payment?.id)) : null;
      const shouldSuggestNextPeriod = Boolean(next.contractId);
      if (shouldSuggestNextPeriod && situation) {
        merged.periodStart = situation.nextPeriodStart;
        merged.periodEnd = situation.nextPeriodEnd;
      }
      const expected = expectedPaymentForPeriod(contract, merged.periodStart, merged.periodEnd);
      return { ...merged, amount: next.amount ?? expected, status: computePaymentStatus(Number(next.amount ?? expected) || 0, expected) };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!values.contractId) return setError("Sélectionnez un contrat.");
    if (!values.paymentDate) return setError("La date de paiement est obligatoire.");
    if (!values.periodStart || !values.periodEnd) return setError("La période couverte par le paiement est obligatoire.");
    if (new Date(values.periodEnd) < new Date(values.periodStart)) return setError("La date de fin de période doit être postérieure ou égale à la date de début.");
    if (Number(values.amount) <= 0) return setError("Le montant payé doit être supérieur à zéro.");
    await onSubmit({ ...values, amount: Number(values.amount), status: calculatedStatus });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <label className="grid gap-2 text-sm font-medium text-sobaya-ink">
        Contrat concerné *
        <select value={values.contractId} onChange={(event) => recompute({ contractId: event.target.value })} className="h-11 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-ink">
          <option value="">Sélectionner un contrat</option>
          {contracts.map((contract) => (
            <option key={contract.id} value={contract.id}>{contract.contractNumber} · {contract.tenantName} · {contract.propertyName}{isActiveContract(contract) ? "" : " · non actif"}</option>
          ))}
        </select>
        <span className="text-xs font-normal text-sobaya-muted">Le paiement récupère automatiquement le locataire, le bien, le loyer et les charges du contrat.</span>
      </label>

      {selectedContract ? (
        <div className="rounded-xl border border-sobaya-border bg-sobaya-soft/50 px-4 py-3 text-sm text-sobaya-ink">
          {rentSituation ? <p className="mb-1 font-medium">Prochaine période suggérée : {rentSituation.nextPeriodLabel}</p> : null}
          <p className="font-medium">Période couverte : {periodLabel}</p>
          <p className="mt-1 text-sobaya-muted">Mensualité : {money(monthlyAmount)} · Montant attendu sur la période : {money(expectedAmount)}</p>
          <p className="mt-1 text-sobaya-muted">Statut calculé : <span className="font-medium text-sobaya-ink">{calculatedStatus === "completed" ? "Payé" : calculatedStatus === "partial" ? "Paiement partiel" : "En attente"}</span>{balance.remaining > 0 ? ` · Solde restant : ${money(balance.remaining)}` : ""}{balance.overpaid > 0 ? ` · Trop-perçu : ${money(balance.overpaid)}` : ""}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Date de paiement" required help="Date réelle d'encaissement du paiement.">
          <input type="date" value={values.paymentDate} onChange={(event) => setValues((current) => ({ ...current, paymentDate: event.target.value }))} className="h-11 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-ink" />
        </FormField>
        <FormField label="Paiement couvrant la période de" required help="Début de la période locative payée.">
          <input type="date" value={values.periodStart} onChange={(event) => recompute({ periodStart: event.target.value })} className="h-11 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-ink" />
        </FormField>
        <FormField label="À" required help="Fin de la période locative payée.">
          <input type="date" value={values.periodEnd} onChange={(event) => recompute({ periodEnd: event.target.value })} className="h-11 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-ink" />
        </FormField>
        <FormField label="Montant payé (FCFA)" required help="Prérempli selon la période. Modifiez-le en cas de paiement partiel ou d'avance.">
          <input type="number" min={0} value={values.amount} onChange={(event) => recompute({ amount: Number(event.target.value) })} placeholder="Ex : 250000" className="h-11 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-ink" />
        </FormField>
        <label className="grid gap-2 text-sm font-medium text-sobaya-ink">
          Mode de paiement *
          <select value={values.paymentMethod} onChange={(event) => setValues((current) => ({ ...current, paymentMethod: event.target.value as PaymentMethod }))} className="h-11 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-ink">
            {methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
          </select>
        </label>
        <FormField label="Statut du paiement" help="Calculé automatiquement à partir de la période et du montant payé.">
          <input readOnly value={calculatedStatus === "completed" ? "Payé" : calculatedStatus === "partial" ? "Partiel" : "En attente"} className="h-11 rounded-xl border border-sobaya-border bg-sobaya-soft px-3 text-sm outline-none" />
        </FormField>
        <FormField label="Référence de paiement" help="Numéro transaction mobile money, référence bancaire ou reçu manuel.">
          <input value={values.reference} onChange={(event) => setValues((current) => ({ ...current, reference: event.target.value }))} placeholder="Ex : OM-2026-001" className="h-11 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-ink" />
        </FormField>
      </div>
      <FormField label="Observation" help="Information interne utile pour le suivi financier.">
        <textarea value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} placeholder="Ex : Paiement partiel reçu par Wave" className="min-h-24 rounded-xl border border-sobaya-border bg-white px-3 py-3 text-sm outline-none focus:border-sobaya-ink" />
      </FormField>
      <div className="flex flex-wrap gap-3">
        <Button disabled={loading}>{loading ? "Enregistrement..." : payment ? "Mettre à jour" : "Enregistrer le paiement"}</Button>
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button> : null}
      </div>
    </form>
  );
}
