"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Edit3, Plus, Trash2, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { archiveOwnerMandate, createOwnerMandate, listOwnerMandates, updateOwnerMandate } from "@/services/owner-mandates";
import { listProperties } from "@/services/properties";
import { listContracts } from "@/services/contracts";
import { listPayments } from "@/services/payments";
import { OwnerMandateForm } from "@/components/owner-mandates/owner-mandate-form";
import type { OwnerMandate, OwnerMandateFormValues } from "@/types/owner-mandate";
import type { Property } from "@/types/property";
import type { Contract } from "@/types/contract";
import type { Payment } from "@/types/payment";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function OwnerMandatesManager() {
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("search") ?? "").trim().toLowerCase();
  const { firebaseUser, organization, profile } = useAuth();
  const [owners, setOwners] = useState<OwnerMandate[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editing, setEditing] = useState<OwnerMandate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [ownerData, propertyData, contractData, paymentData] = await Promise.all([
        listOwnerMandates(organization.id).catch(() => []),
        listProperties(organization.id).catch(() => []),
        listContracts(organization.id).catch(() => []),
        listPayments(organization.id).catch(() => [])
      ]);
      setOwners(ownerData);
      setProperties(propertyData);
      setContracts(contractData);
      setPayments(paymentData);
    } catch {
      setError("Impossible de charger les propriétaires mandants.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => {
    const attachedProperties = properties.filter((property) => property.ownerMandateId);
    const collected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const commissions = payments.reduce((sum, payment) => sum + Number(payment.agencyCommissionAmount || 0), 0);
    const ownerNet = payments.reduce((sum, payment) => sum + Number(payment.ownerNetAmount || 0), 0);
    return { owners: owners.length, attachedProperties: attachedProperties.length, collected, commissions, ownerNet };
  }, [owners, properties, payments]);

  const visibleOwners = useMemo(() => {
    if (!searchTerm) return owners;
    return owners.filter((owner) => `${owner.fullName} ${owner.ownerNumber} ${owner.phone} ${owner.email}`.toLowerCase().includes(searchTerm));
  }, [owners, searchTerm]);

  async function handleSubmit(values: OwnerMandateFormValues) {
    if (!organization?.id) return;
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateOwnerMandate(organization.id, editing.id, values, { userId: firebaseUser?.uid, userName: profile?.displayName });
      } else {
        await createOwnerMandate(organization.id, values, { userId: firebaseUser?.uid, userName: profile?.displayName });
      }
      setShowForm(false);
      setEditing(null);
      await refresh();
    } catch {
      setError("Enregistrement impossible. Vérifiez les permissions et les champs obligatoires.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(owner: OwnerMandate) {
    if (!organization?.id || !confirm(`Archiver le propriétaire ${owner.fullName} ?`)) return;
    await archiveOwnerMandate(organization.id, owner, { userId: firebaseUser?.uid, userName: profile?.displayName });
    await refresh();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Propriétaires mandants" description="Gérez les propriétaires clients d'une agence ou d'un agent, même lorsqu'ils n'ont pas de compte SOBAYA." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Propriétaires" value={stats.owners} helper="Mandants actifs" />
        <MetricCard label="Biens rattachés" value={stats.attachedProperties} helper="Patrimoine confié" />
        <MetricCard label="Commissions" value={money(stats.commissions)} helper="Sur paiements encaissés" />
        <MetricCard label="À reverser" value={money(stats.ownerNet)} helper="Net propriétaire" />
      </div>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Liste des propriétaires</p>
            <p className="text-sm text-sobaya-muted">Chaque propriétaire peut être rattaché à un ou plusieurs biens.</p>
          </div>
          <Button className="w-full sm:w-fit" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Ajouter un propriétaire</Button>
        </div>
        {showForm ? <div className="mb-5 rounded-2xl border border-sobaya-border p-4"><OwnerMandateForm owner={editing} loading={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} /></div> : null}
        {searchTerm ? <div className="mb-4"><StatusBadge tone="neutral">Recherche : « {searchParams.get("search")} »</StatusBadge></div> : null}
        {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}
        {!loading && owners.length === 0 ? <EmptyState icon={<UserRoundCheck size={34} />} title="Aucun propriétaire mandant" description="Ajoutez les propriétaires pour lesquels vous gérez des biens." action={<Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Ajouter</Button>} /> : null}
        {!loading && owners.length > 0 && visibleOwners.length === 0 ? <Card className="text-sm text-sobaya-muted">Aucun propriétaire ne correspond à la recherche.</Card> : null}
        <div className="grid gap-3">
          {visibleOwners.map((owner) => {
            const ownerProperties = properties.filter((property) => property.ownerMandateId === owner.id);
            const ownerContracts = contracts.filter((contract) => contract.ownerMandateId === owner.id);
            const ownerPayments = payments.filter((payment) => payment.ownerMandateId === owner.id);
            const commissions = ownerPayments.reduce((sum, payment) => sum + Number(payment.agencyCommissionAmount || 0), 0);
            const net = ownerPayments.reduce((sum, payment) => sum + Number(payment.ownerNetAmount || 0), 0);
            return (
              <div key={owner.id} className="rounded-2xl border border-sobaya-border p-4 transition hover:bg-sobaya-soft/60">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">{owner.ownerNumber ? `${owner.ownerNumber} — ` : ""}{owner.fullName}</p>
                    <p className="mt-1 text-sm text-sobaya-muted">{owner.phone}{owner.email ? ` · ${owner.email}` : ""}</p>
                    <p className="mt-2 text-sm text-sobaya-muted">{ownerProperties.length} bien(s) · {ownerContracts.length} contrat(s) · commissions {money(commissions)} · net propriétaire {money(net)}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary" onClick={() => { setEditing(owner); setShowForm(true); }}><Edit3 size={16} /> Modifier</Button>
                    <Button variant="secondary" onClick={() => handleArchive(owner)}><Trash2 size={16} /> Archiver</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
