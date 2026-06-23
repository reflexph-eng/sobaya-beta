"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { listUserConsents } from "@/services/governance";
import { LEGAL_DOCUMENTS } from "@/constants/legal-documents";
import type { LegalDocumentType, UserConsent } from "@/types/governance";

const DOCUMENT_LABELS: Record<LegalDocumentType, string> = {
  cgu: "Conditions Générales d'Utilisation",
  cgs: "Conditions Générales de Service",
  privacy_policy: "Politique de confidentialité",
  verification_policy: "Politique de vérification",
  legal_notice: "Mentions légales"
};

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = (value as { toDate?: () => Date }).toDate ? (value as { toDate: () => Date }).toDate() : new Date(value as string);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ConsentHistory() {
  const { firebaseUser } = useAuth();
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    listUserConsents(firebaseUser.uid)
      .then(setConsents)
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  return (
    <Card className="mt-6 max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck size={18} className="text-sobaya-primary" />
        <p className="text-lg font-medium">Historique de mes consentements</p>
      </div>

      {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}

      {!loading && consents.length === 0 ? (
        <p className="text-sm text-sobaya-muted">Aucun consentement enregistré pour le moment.</p>
      ) : null}

      <div className="space-y-2">
        {consents.map((consent) => (
          <div key={consent.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sobaya-border px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-sobaya-ink">{DOCUMENT_LABELS[consent.documentType]}</p>
              <p className="text-xs text-sobaya-muted">Version {consent.version}{LEGAL_DOCUMENTS[consent.documentType].version !== consent.version ? " · une version plus récente existe" : ""}</p>
            </div>
            <p className="text-xs text-sobaya-muted">{formatDate(consent.acceptedAt)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
