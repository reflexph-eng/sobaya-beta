import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { LegalPagePublic } from "@/components/legal/legal-page-public";
import { LEGAL_DOCUMENTS } from "@/constants/legal-documents";
import type { LegalDocumentType } from "@/types/governance";
import type { EditableLegalType } from "@/services/legal-pages";

const SLUG_TO_TYPE: Record<string, LegalDocumentType> = {
  cgu: "cgu",
  cgs: "cgs",
  confidentialite: "privacy_policy",
  verification: "verification_policy",
  "mentions-legales": "legal_notice"
};

// Pages éditables depuis l'admin
const EDITABLE_SLUGS: EditableLegalType[] = ["cgu", "confidentialite", "mentions-legales", "cgs", "verification"];

export function generateStaticParams() {
  return Object.keys(SLUG_TO_TYPE).map((type) => ({ type }));
}

export const dynamic = "force-dynamic";

export default function LegalDocumentPage({ params }: { params: { type: string } }) {
  const documentType = SLUG_TO_TYPE[params.type];
  if (!documentType) notFound();

  const staticDoc = LEGAL_DOCUMENTS[documentType];
  const isEditable = EDITABLE_SLUGS.includes(params.type as EditableLegalType);

  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <div className="mx-auto max-w-3xl px-5 pb-16 pt-8">
        <LegalPagePublic
          slug={params.type}
          isEditable={isEditable}
          staticContent={staticDoc.content}
          staticDate={staticDoc.effectiveDate}
          staticVersion={staticDoc.version}
          isDraft={staticDoc.isDraft}
        />
      </div>
    </main>
  );
}
