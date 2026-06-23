"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { SimpleMarkdown } from "@/components/ui/simple-markdown";
import { recordConsent } from "@/services/governance";
import { LEGAL_DOCUMENTS } from "@/constants/legal-documents";
import type { LegalDocumentType } from "@/types/governance";

const DOCUMENT_LABELS: Record<LegalDocumentType, string> = {
  cgu: "Conditions Générales d'Utilisation",
  cgs: "Conditions Générales de Service",
  privacy_policy: "Politique de confidentialité",
  verification_policy: "Politique de vérification",
  legal_notice: "Mentions légales"
};

export function ConsentGate({ userId, missingTypes, onAccepted }: { userId: string; missingTypes: LegalDocumentType[]; onAccepted: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentType = missingTypes[activeIndex];
  const document = LEGAL_DOCUMENTS[currentType];
  const isLast = activeIndex === missingTypes.length - 1;

  async function handleAccept() {
    if (!checked) return;
    setSaving(true);
    setError("");
    try {
      await recordConsent(userId, currentType, typeof navigator !== "undefined" ? navigator.userAgent : undefined);
      if (isLast) {
        onAccepted();
      } else {
        setActiveIndex((index) => index + 1);
        setChecked(false);
      }
    } catch {
      setError("Impossible d'enregistrer votre acceptation. Vérifiez votre connexion et réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sobaya-soft px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-sobaya-border bg-white p-6 shadow-soft sm:p-8">
        <div className="flex justify-center"><BrandLogo priority /></div>
        <p className="mt-4 text-center text-sm text-sobaya-muted">
          Document {activeIndex + 1} sur {missingTypes.length} — merci de prendre connaissance de ce texte avant de continuer.
        </p>

        {document.isDraft ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            ⚠️ Version de travail {document.version}, en cours de validation juridique.
          </div>
        ) : null}

        <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-sobaya-border p-4">
          <SimpleMarkdown content={document.content} />
        </div>

        {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        <label className="mt-5 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-sobaya-border" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          <span>J&apos;ai lu et j&apos;accepte les {DOCUMENT_LABELS[currentType]} (version {document.version}).</span>
        </label>

        <Button className="mt-5 w-full" disabled={!checked || saving} onClick={handleAccept}>
          {saving ? "Enregistrement..." : isLast ? "Accepter et continuer" : "Accepter et passer au document suivant"}
        </Button>
      </div>
    </main>
  );
}
