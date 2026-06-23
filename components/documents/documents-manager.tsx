"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { SelectField } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { archiveDocument, listDocuments } from "@/services/documents";
import { listProperties } from "@/services/properties";
import { listTenants } from "@/services/tenants";
import { listContracts } from "@/services/contracts";
import { listOwnerMandates } from "@/services/owner-mandates";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_ENTITY_LABELS } from "@/types/document";
import type { DocumentCategory, DocumentEntityType, OrgDocument } from "@/types/document";
import type { Property } from "@/types/property";
import type { Tenant } from "@/types/tenant";
import type { Contract } from "@/types/contract";
import type { OwnerMandate } from "@/types/owner-mandate";

function formatSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentsManager() {
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("search") ?? "").trim().toLowerCase();
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canManage = isSuperAdmin || can(permissions, PERMISSIONS.DOCUMENTS_MANAGE);

  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [owners, setOwners] = useState<OwnerMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "all">("all");
  const [entityFilter, setEntityFilter] = useState<DocumentEntityType | "all">("all");

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [documentsData, propertiesData, tenantsData, contractsData, ownersData] = await Promise.all([
        listDocuments(organization.id),
        listProperties(organization.id).catch(() => []),
        listTenants(organization.id).catch(() => []),
        listContracts(organization.id).catch(() => []),
        listOwnerMandates(organization.id).catch(() => [])
      ]);
      setDocuments(documentsData);
      setProperties(propertiesData);
      setTenants(tenantsData);
      setContracts(contractsData);
      setOwners(ownersData);
    } catch {
      setError("Impossible de charger les documents. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const totalSize = documents.reduce((sum, d) => sum + Number(d.fileSizeBytes || 0), 0);
    const attached = documents.filter((d) => d.entityType).length;
    return {
      total: documents.length,
      attached,
      free: documents.length - attached,
      totalSize
    };
  }, [documents]);

  const visibleDocuments = useMemo(() => {
    return documents.filter((document) => {
      if (categoryFilter !== "all" && document.category !== categoryFilter) return false;
      if (entityFilter !== "all" && document.entityType !== entityFilter) return false;
      if (searchTerm) {
        const haystack = `${document.name} ${document.entityLabel ?? ""} ${document.notes ?? ""}`.toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }
      return true;
    });
  }, [documents, categoryFilter, entityFilter, searchTerm]);

  async function handleArchive(document: OrgDocument) {
    if (!organization?.id || !confirm(`Supprimer le document « ${document.name} » ?`)) return;
    setError("");
    try {
      await archiveDocument(organization.id, document, { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined });
      await refresh();
    } catch {
      setError("Suppression impossible. Vérifiez vos permissions.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Documents" description="Coffre-fort documentaire : contrats, pièces d'identité, ACD, factures, plans et documents techniques." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Documents" value={stats.total} helper="Tous types confondus" />
        <MetricCard label="Rattachés" value={stats.attached} helper="Liés à une fiche" />
        <MetricCard label="Libres" value={stats.free} helper="Non rattachés" />
        <MetricCard label="Espace utilisé" value={formatSize(stats.totalSize)} helper="Total des fichiers" />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Coffre-fort</p>
            <p className="text-sm text-sobaya-muted">Centralisez les documents de votre organisation, classés par catégorie et rattachables à une fiche.</p>
          </div>
          {canManage ? <Button className="w-full sm:w-fit" onClick={() => setShowForm((current) => !current)}>{showForm ? "Fermer" : "Téléverser un document"}</Button> : null}
        </div>

        {showForm && organization?.id ? (
          <div className="mb-5 rounded-2xl border border-sobaya-border p-4">
            <DocumentUploadForm
              organizationId={organization.id}
              properties={properties}
              tenants={tenants}
              contracts={contracts}
              owners={owners}
              actor={{ userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined }}
              onUploaded={() => { setShowForm(false); refresh(); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <SelectField label="Filtrer par catégorie" value={categoryFilter} onChange={(value) => setCategoryFilter(value as DocumentCategory | "all")}>
            <option value="all">Toutes les catégories</option>
            {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <SelectField label="Filtrer par type de fiche" value={entityFilter} onChange={(value) => setEntityFilter(value as DocumentEntityType | "all")}>
            <option value="all">Tous</option>
            {Object.entries(DOCUMENT_ENTITY_LABELS).filter(([value]) => value !== "organization").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
        </div>

        {searchTerm ? <div className="mb-4"><StatusBadge tone="neutral">Recherche : « {searchParams.get("search")} »</StatusBadge></div> : null}

        {loading ? <p className="text-sm text-sobaya-muted">Chargement des documents...</p> : null}

        {!loading && documents.length === 0 ? (
          <EmptyState
            icon={<FileText size={34} />}
            title="Aucun document"
            description="Téléversez le premier document du coffre-fort : contrat, pièce d'identité, ACD, facture, plan..."
            action={canManage ? <Button onClick={() => setShowForm(true)}>Téléverser un document</Button> : null}
          />
        ) : null}

        {!loading && documents.length > 0 && visibleDocuments.length === 0 ? (
          <Card className="text-sm text-sobaya-muted">Aucun document ne correspond aux filtres.</Card>
        ) : null}

        <div className="grid gap-3">
          {visibleDocuments.map((document) => (
            <div key={document.id} className="flex flex-col gap-3 rounded-2xl border border-sobaya-border p-4 transition hover:bg-sobaya-soft/60 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{document.name}</p>
                  <StatusBadge>{DOCUMENT_CATEGORY_LABELS[document.category]}</StatusBadge>
                  {document.entityType && document.entityLabel ? (
                    <StatusBadge tone="success">{DOCUMENT_ENTITY_LABELS[document.entityType]} : {document.entityLabel}</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Document libre</StatusBadge>
                  )}
                </div>
                <p className="mt-1 text-xs text-sobaya-muted">{formatSize(document.fileSizeBytes)}{document.notes ? ` · ${document.notes}` : ""}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={document.fileUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sobaya-border bg-white px-5 py-2 text-sm font-medium text-sobaya-ink transition hover:bg-sobaya-soft">
                  <Download size={16} /> Ouvrir
                </a>
                {canManage ? <Button variant="secondary" onClick={() => handleArchive(document)}><Trash2 size={16} /> Supprimer</Button> : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
