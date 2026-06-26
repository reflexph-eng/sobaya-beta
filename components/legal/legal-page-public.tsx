"use client";

import { useEffect, useState } from "react";
import { SimpleMarkdown } from "@/components/ui/simple-markdown";
import { getLegalPage } from "@/services/legal-pages";
import type { EditableLegalType } from "@/services/legal-pages";

interface Props {
  slug: string;
  isEditable: boolean;
  staticContent: string;
  staticDate: string;
  staticVersion: string;
  isDraft?: boolean;
}

export function LegalPagePublic({
  slug, isEditable, staticContent, staticDate, staticVersion, isDraft
}: Props) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditable);

  useEffect(() => {
    if (!isEditable) return;
    getLegalPage(slug as EditableLegalType)
      .then(page => { if (page?.content) setHtmlContent(page.content); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, isEditable]);

  if (loading) {
    return <div className="py-20 text-center text-sm text-sobaya-muted">Chargement...</div>;
  }

  // Contenu Firestore disponible → afficher le HTML TipTap
  if (htmlContent) {
    return (
      <div
        className="prose prose-sm max-w-none text-sobaya-ink"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // Fallback → contenu statique markdown
  return (
    <>
      {isDraft && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">⚠️ Document de travail — version {staticVersion}</p>
          <p className="mt-1">Ce texte est une version provisoire en cours de validation juridique.</p>
        </div>
      )}
      <SimpleMarkdown content={staticContent} />
      <p className="mt-8 text-xs text-sobaya-muted">
        En vigueur depuis le {staticDate} · Version {staticVersion}
      </p>
    </>
  );
}
