"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { RichEditor } from "@/components/ui/rich-editor";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { getLegalPage, getLegalTitle, saveLegalPage } from "@/services/legal-pages";
import { useAuth } from "@/components/providers/auth-provider";
import type { EditableLegalType } from "@/services/legal-pages";

const PAGES: EditableLegalType[] = ["cgu", "confidentialite", "mentions-legales", "cgs", "verification"];

export function LegalPagesManager() {
  const { firebaseUser } = useAuth();
  const [active, setActive] = useState<EditableLegalType>("cgu");
  const [contents, setContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        PAGES.map(async type => {
          const page = await getLegalPage(type);
          return [type, page?.content ?? ""] as const;
        })
      );
      setContents(Object.fromEntries(results));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await saveLegalPage(active, contents[active] ?? "", firebaseUser?.uid);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  }

  return (
    <SuperAdminGate require="canAccessAdmin">
      <div className="space-y-6">
        <PageHeader
          title="Pages légales"
          description="Modifiez le contenu des pages légales affichées sur la plateforme."
        />

        {/* Onglets */}
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-sobaya-border bg-sobaya-soft p-1">
          {PAGES.map(type => (
            <button
              key={type}
              onClick={() => { setActive(type); setSaved(false); }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                active === type
                  ? "bg-white shadow-sm text-sobaya-ink"
                  : "text-sobaya-muted hover:text-sobaya-ink"
              }`}
            >
              <FileText size={14} />
              {type === "cgu" ? "CGU" : type === "confidentialite" ? "Confidentialité" : type === "mentions-legales" ? "Mentions légales" : type === "cgs" ? "CGS" : "Vérification"}
            </button>
          ))}
        </div>

        {/* Éditeur */}
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-sobaya-muted">
            Chargement...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-sobaya-ink">{getLegalTitle(active)}</p>
              <div className="flex items-center gap-3">
                {saved && <span className="text-sm text-emerald-600">✓ Enregistré</span>}
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
            <RichEditor
              content={contents[active] ?? ""}
              onChange={html => setContents(prev => ({ ...prev, [active]: html }))}
            />
            <p className="text-xs text-sobaya-muted">
              Le contenu est visible immédiatement sur la page publique après enregistrement.
              La page{" "}
              <a
                href={`/legal/${active}`}
                target="_blank"
                rel="noreferrer"
                className="text-sobaya-primary underline underline-offset-2"
              >
                /legal/{active}
              </a>
              {" "}se met à jour en temps réel.
            </p>
          </div>
        )}
      </div>
    </SuperAdminGate>
  );
}
