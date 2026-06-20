"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Edit3, FileText, Printer, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentForm } from "@/components/payments/payment-form";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { archivePayment, createPayment, listPayments, updatePayment } from "@/services/payments";
import { buildReceiptUrl, issueReceipt } from "@/services/receipts";
import { listContracts } from "@/services/contracts";
import type { Contract } from "@/types/contract";
import type { Payment, PaymentFormValues, PaymentMethod, PaymentStatus } from "@/types/payment";

const methodLabels: Record<PaymentMethod, string> = {
  cash: "Espèces",
  orange_money: "Orange Money",
  wave: "Wave",
  bank_transfer: "Virement",
  check: "Chèque",
  other: "Autre"
};

const statusLabels: Record<PaymentStatus, string> = {
  completed: "Payé",
  partial: "Partiel",
  pending: "En attente",
  cancelled: "Annulé"
};

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function PaymentsManager() {
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canCreate = isSuperAdmin || can(permissions, PERMISSIONS.PAYMENTS_CREATE) || can(permissions, PERMISSIONS.PAYMENTS_MANAGE);
  const canUpdate = isSuperAdmin || can(permissions, PERMISSIONS.PAYMENTS_UPDATE) || can(permissions, PERMISSIONS.PAYMENTS_MANAGE);
  const canDelete = isSuperAdmin || can(permissions, PERMISSIONS.PAYMENTS_DELETE) || can(permissions, PERMISSIONS.PAYMENTS_MANAGE);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [paymentsData, contractsData] = await Promise.all([
        listPayments(organization.id),
        listContracts(organization.id)
      ]);
      setPayments(paymentsData);
      setContracts(contractsData);
    } catch {
      setError("Impossible de charger les paiements. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const validPayments = payments.filter((payment) => payment.status !== "cancelled");
    const collected = validPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const monthPayments = validPayments.filter((payment) => {
      const date = new Date(payment.paymentDate);
      return date.getMonth() === month && date.getFullYear() === year;
    });
    const monthlyCollected = monthPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const pendingContracts = contracts.filter((contract) => contract.status === "active" && Number(contract.balance || 0) > 0).length;
    const lateContracts = contracts.filter((contract) => contract.status === "active" && contract.nextDueDate && new Date(contract.nextDueDate) < now && Number(contract.balance || 0) > 0).length;
    return { collected, monthlyCollected, pendingContracts, lateContracts };
  }, [payments, contracts]);

  async function handleSubmit(values: PaymentFormValues) {
    if (!organization?.id) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updatePayment(organization.id, editing.id, values, contracts, { userId: firebaseUser?.uid, userName: profile?.displayName });
      } else {
        await createPayment(organization.id, values, contracts, { userId: firebaseUser?.uid, userName: profile?.displayName });
      }
      setShowForm(false);
      setEditing(null);
      await refresh();
    } catch {
      setError("Enregistrement du paiement impossible. Vérifiez vos permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenReceipt(payment: Payment) {
    if (!organization?.id) return;
    setError("");
    try {
      // Idempotent: republie la quittance publique si elle manque déjà, sans casser le paiement existant.
      await issueReceipt(organization.id, payment, { userId: firebaseUser?.uid, userName: profile?.displayName });
      await refresh();
      window.open(buildReceiptUrl(payment.receiptNumber), "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setError("Ouverture de la quittance impossible. Vérifiez les règles Firestore et la publication publique.");
    }
  }

  async function handleArchive(payment: Payment) {
    if (!organization?.id || !confirm(`Archiver le paiement ${payment.receiptNumber} ?`)) return;
    setError("");
    try {
      await archivePayment(organization.id, payment, contracts, { userId: firebaseUser?.uid, userName: profile?.displayName });
      await refresh();
    } catch {
      setError("Archivage du paiement impossible. Vérifiez vos permissions.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Paiements" description="Enregistrez les encaissements, suivez les soldes et préparez les quittances." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Montant encaissé" value={money(stats.collected)} compact helper="Total hors paiements annulés" />
        <MetricCard label="Paiements du mois" value={money(stats.monthlyCollected)} compact helper="Encaissements mensuels" />
        <MetricCard label="Impayés" value={stats.pendingContracts} helper="Contrats avec solde" />
        <MetricCard label="Retards" value={stats.lateContracts} helper="Échéances dépassées" />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Historique des paiements</p>
            <p className="text-sm text-sobaya-muted">Chaque paiement reste lié au contrat, au locataire et au bien.</p>
          </div>
          {canCreate ? <Button className="w-full sm:w-fit" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nouveau paiement</Button> : null}
        </div>

        {contracts.length === 0 ? (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Créez d’abord un contrat actif avant d’enregistrer un paiement.</p>
        ) : null}

        {showForm ? (
          <div className="mb-5 rounded-2xl border border-sobaya-border p-4">
            <PaymentForm payment={editing} contracts={contracts} loading={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} />
          </div>
        ) : null}

        {loading ? <p className="text-sm text-sobaya-muted">Chargement des paiements...</p> : null}

        {!loading && payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={34} />}
            title="Aucun paiement enregistré"
            description="Enregistrez le premier encaissement lié à un contrat pour générer ensuite une quittance."
            action={canCreate && contracts.length > 0 ? <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nouveau paiement</Button> : null}
          />
        ) : null}

        <div className="grid gap-3">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl border border-sobaya-border p-4 transition hover:bg-sobaya-soft/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{payment.receiptNumber}</p>
                    <StatusBadge tone={payment.status === "completed" ? "success" : payment.status === "pending" ? "warning" : payment.status === "cancelled" ? "danger" : "neutral"}>{statusLabels[payment.status]}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-sobaya-muted">{payment.paymentDate} · {payment.tenantName} · {payment.propertyName}</p>
                  <p className="mt-2 text-sm text-sobaya-muted">{money(payment.amount)} · {methodLabels[payment.paymentMethod]} · réf. {payment.reference || "Non renseignée"}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button variant="secondary" onClick={() => handleOpenReceipt(payment)}>
                    <FileText size={16} /> {payment.receiptIssuedAt ? "Voir quittance" : "Générer quittance"}
                  </Button>
                  <Button variant="secondary" onClick={() => handleOpenReceipt(payment)}><Printer size={16} /> PDF / Imprimer</Button>
                  {canUpdate ? <Button variant="secondary" onClick={() => { setEditing(payment); setShowForm(true); }}><Edit3 size={16} /> Modifier</Button> : null}
                  {canDelete ? <Button variant="secondary" onClick={() => handleArchive(payment)}><Trash2 size={16} /> Archiver</Button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
