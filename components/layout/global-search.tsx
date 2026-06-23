"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { listProperties } from "@/services/properties";
import { listTenants } from "@/services/tenants";
import { listContracts } from "@/services/contracts";
import { listOwnerMandates } from "@/services/owner-mandates";
import { listBookings } from "@/services/bookings";
import { listDocuments } from "@/services/documents";

type SearchItem = { type: string; label: string; detail: string; href: string; tokens: string };

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const { organization } = useAuth();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!organization?.id) {
      setItems([]);
      return;
    }
    Promise.all([
      listProperties(organization.id).catch(() => []),
      listTenants(organization.id).catch(() => []),
      listContracts(organization.id).catch(() => []),
      listOwnerMandates(organization.id).catch(() => []),
      listBookings(organization.id).catch(() => []),
      listDocuments(organization.id).catch(() => [])
    ]).then(([properties, tenants, contracts, owners, bookings, documents]) => {
      if (!mounted) return;
      setItems([
        ...properties.filter((item) => item.isDeleted !== true && item.status !== "archived").map((item) => ({ type: "Bien", label: item.name, detail: `${item.reference || "Sans référence"} · ${item.commune || item.city || "Adresse à compléter"}`, href: `/biens?search=${encodeURIComponent(item.reference || item.name)}`, tokens: `${item.name} ${item.reference} ${item.commune} ${item.city} ${item.ownerName}` })),
        ...tenants.filter((item) => item.isDeleted !== true).map((item) => ({ type: "Locataire", label: item.fullName, detail: `${item.tenantNumber || "Sans référence"} · ${item.phone || "Contact à compléter"}`, href: `/locataires?search=${encodeURIComponent(item.fullName)}`, tokens: `${item.fullName} ${item.tenantNumber} ${item.phone} ${item.email}` })),
        ...contracts.filter((item) => item.isDeleted !== true).map((item) => ({ type: "Contrat", label: item.contractNumber, detail: `${item.tenantName} · ${item.propertyName}`, href: `/contrats?search=${encodeURIComponent(item.contractNumber)}`, tokens: `${item.contractNumber} ${item.tenantName} ${item.propertyName} ${item.ownerName}` })),
        ...owners.filter((item) => item.isDeleted !== true && item.status !== "archived").map((item) => ({ type: "Mandant", label: item.fullName, detail: `${item.ownerNumber || "Sans référence"} · ${item.phone || "Contact à compléter"}`, href: `/proprietaires?search=${encodeURIComponent(item.fullName)}`, tokens: `${item.fullName} ${item.ownerNumber} ${item.phone} ${item.email}` })),
        ...bookings.filter((item) => item.isDeleted !== true).map((item) => ({ type: "Réservation", label: item.guestName, detail: `${item.bookingNumber} · ${item.propertyName}`, href: `/reservations?search=${encodeURIComponent(item.bookingNumber)}`, tokens: `${item.guestName} ${item.guestPhone} ${item.bookingNumber} ${item.propertyName}` })),
        ...documents.filter((item) => item.isDeleted !== true).map((item) => ({ type: "Document", label: item.name, detail: item.entityLabel ? `${item.entityLabel}` : "Document libre", href: `/documents?search=${encodeURIComponent(item.name)}`, tokens: `${item.name} ${item.entityLabel ?? ""} ${item.notes ?? ""}` }))
      ]);
    });
    return () => { mounted = false; };
  }, [organization?.id]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];
    return items.filter((item) => item.tokens.toLowerCase().includes(normalized)).slice(0, 8);
  }, [items, query]);

  return (
    <div className="relative w-full">
      <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sobaya-muted" />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={compact ? "Rechercher..." : "Recherche globale : bien, locataire, contrat, mandant, référence"} className="pl-10" />
      {results.length > 0 ? (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-sobaya-border bg-white shadow-xl">
          {results.map((item, index) => (
            <Link key={`${item.type}-${item.label}-${index}`} href={item.href} onClick={() => setQuery("")} className="block border-b border-sobaya-border px-4 py-3 text-sm last:border-b-0 hover:bg-sobaya-soft">
              <span className="text-xs font-semibold uppercase tracking-wide text-sobaya-primary">{item.type}</span>
              <span className="mt-1 block font-medium text-sobaya-ink">{item.label}</span>
              <span className="mt-0.5 block text-xs text-sobaya-muted">{item.detail}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
