import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { SimpleMarkdown } from "@/components/ui/simple-markdown";
import { LEGAL_DOCUMENTS } from "@/constants/legal-documents";
import type { LegalDocumentType } from "@/types/governance";

const SLUG_TO_TYPE: Record<string, LegalDocumentType> = {
  cgu: "cgu",
  cgs: "cgs",
  confidentialite: "privacy_policy",
  verification: "verification_policy",
  "mentions-legales": "legal_notice"
};

export function generateStaticParams() {
  return Object.keys(SLUG_TO_TYPE).map((type) => ({ type }));
}

export default function LegalDocumentPage({ params }: { params: { type: string } }) {
  const documentType = SLUG_TO_TYPE[params.type];
  if (!documentType) notFound();

  const document = LEGAL_DOCUMENTS[documentType];

  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <div className="mx-auto max-w-3xl px-5 pb-16">
        {document.isDraft ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">⚠️ Document de travail — version {document.version}</p>
            <p className="mt-1">Ce texte est une version provisoire en cours de validation juridique. Il ne constitue pas encore un document définitif.</p>
          </div>
        ) : null}
        <SimpleMarkdown content={document.content} />
        <p className="mt-8 text-xs text-sobaya-muted">En vigueur depuis le {document.effectiveDate} · Version {document.version}</p>
      </div>
    </main>
  );
}
