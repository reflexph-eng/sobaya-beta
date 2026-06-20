"use client";

import { useCallback, useEffect, useState } from "react";
import { ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { listArchivedProperties, restoreProperty } from "@/services/properties";
import { listArchivedTenants, restoreTenant } from "@/services/tenants";
import { listArchivedContracts, listContracts, restoreContract } from "@/services/contracts";
import { listArchivedPayments, restorePayment } from "@/services/payments";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { Contract } from "@/types/contract";
import type { Payment } from "@/types/payment";

type Tab = "properties" | "tenants" | "contracts" | "payments";

type ArchiveItem = Property | Tenant | Contract | Payment;

export function ArchivesManager() {
  const { firebaseUser, organization, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("properties");
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const actor = { userId: firebaseUser?.uid, userName: profile?.displayName };

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [archivedProperties, archivedTenants, archivedContracts, archivedPayments, contractsData] = await Promise.all([
        listArchivedProperties(organization.id),
        listArchivedTenants(organization.id),
        listArchivedContracts(organization.id),
        listArchivedPayments(organization.id),
        listContracts(organization.id)
      ]);
      setProperties(archivedProperties);
      setTenants(archivedTenants);
      setContracts(archivedContracts);
      setPayments(archivedPayments);
      setActiveContracts(contractsData);
    } catch {
      setError("Impossible de charger les archives. Vérifiez les permissions et les index Firestore.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  async function restore(type: Tab, item: ArchiveItem) {
    if (!organization?.id) return;
    if (!confirm("Restaurer cet élément ?")) return;
    if (type === "properties") await restoreProperty(organization.id, item as Property, actor);
    if (type === "tenants") await restoreTenant(organization.id, item as Tenant, actor);
    if (type === "contracts") await restoreContract(organization.id, item as Contract, actor);
    if (type === "payments") await restorePayment(organization.id, item as Payment, activeContracts, actor);
    await refresh();
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "properties", label: "Biens", count: properties.length },
    { id: "tenants", label: "Locataires", count: tenants.length },
    { id: "contracts", label: "Contrats", count: contracts.length },
    { id: "payments", label: "Paiements", count: payments.length }
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Archives" description="Restaurez les biens, locataires, contrats et paiements archivés sans perte de données." />
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Card>
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <Button key={item.id} type="button" variant={tab === item.id ? "primary" : "secondary"} onClick={() => setTab(item.id)}>
              {item.label} ({item.count})
            </Button>
          ))}
        </div>
        {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}
        {!loading && tab === "properties" ? (
          <ArchiveList items={properties} getLabel={(item) => item.name} getMeta={(item) => `${item.reference} · ${item.city}`} onRestore={(item) => restore("properties", item)} />
        ) : null}
        {!loading && tab === "tenants" ? (
          <ArchiveList items={tenants} getLabel={(item) => item.fullName} getMeta={(item) => `${item.phone}${item.email ? ` · ${item.email}` : ""}`} onRestore={(item) => restore("tenants", item)} />
        ) : null}
        {!loading && tab === "contracts" ? (
          <ArchiveList items={contracts} getLabel={(item) => item.contractNumber} getMeta={(item) => `${item.propertyName} · ${item.tenantName}`} onRestore={(item) => restore("contracts", item)} />
        ) : null}
        {!loading && tab === "payments" ? (
          <ArchiveList items={payments} getLabel={(item) => item.receiptNumber} getMeta={(item) => `${item.tenantName} · ${item.propertyName}`} onRestore={(item) => restore("payments", item)} />
        ) : null}
      </Card>
    </div>
  );
}

function ArchiveList<T extends { id: string }>({ items, getLabel, getMeta, onRestore }: { items: T[]; getLabel: (item: T) => string; getMeta: (item: T) => string; onRestore: (item: T) => void }) {
  if (!items.length) return <p className="rounded-xl border border-dashed border-sobaya-border p-5 text-sm text-sobaya-muted">Aucune archive dans cette catégorie.</p>;
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-sobaya-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{getLabel(item)}</p>
            <p className="mt-1 text-sm text-sobaya-muted">{getMeta(item)}</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => onRestore(item)}><ArchiveRestore size={16} /> Restaurer</Button>
        </div>
      ))}
    </div>
  );
}
