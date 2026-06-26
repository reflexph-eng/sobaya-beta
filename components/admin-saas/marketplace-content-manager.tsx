"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { RichEditor } from "@/components/ui/rich-editor";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import {
  createArticle, createRubrique, deleteArticle, deleteRubrique,
  getAllArticles, getAllRubriques, makeSlug, updateArticle, updateRubrique
} from "@/services/marketplace-content";
import type { MarketplaceArticle, MarketplaceRubrique } from "@/services/marketplace-content";

type ArticleForm = {
  rubriqueId: string;
  titre: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  lien: string;
  slug: string;
};

const emptyForm = (rubriqueId: string): ArticleForm => ({
  rubriqueId, titre: "", excerpt: "", content: "", coverImageUrl: "", lien: "", slug: ""
});

export function MarketplaceContentManager() {
  const [rubriques, setRubriques] = useState<MarketplaceRubrique[]>([]);
  const [articles, setArticles] = useState<MarketplaceArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRubrique, setOpenRubrique] = useState<string | null>(null);
  const [newRubTitre, setNewRubTitre] = useState("");
  const [addingRub, setAddingRub] = useState(false);
  const [editRub, setEditRub] = useState<{ id: string; titre: string } | null>(null);
  const [articleForm, setArticleForm] = useState<ArticleForm | null>(null);
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([getAllRubriques(), getAllArticles()]);
      setRubriques(r);
      setArticles(a);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Rubriques ───────────────────────────────────────────────────────────────

  async function handleAddRubrique() {
    if (!newRubTitre.trim()) return;
    setAddingRub(true);
    try {
      await createRubrique(newRubTitre.trim(), rubriques.length + 1);
      setNewRubTitre("");
      await refresh();
    } finally { setAddingRub(false); }
  }

  async function handleToggleRubrique(r: MarketplaceRubrique) {
    await updateRubrique(r.id, { active: !r.active });
    await refresh();
  }

  async function handleDeleteRubrique(r: MarketplaceRubrique) {
    if (!confirm(`Supprimer la rubrique "${r.titre}" et tous ses articles ?`)) return;
    await Promise.all(articles.filter(a => a.rubriqueId === r.id).map(a => deleteArticle(a.id)));
    await deleteRubrique(r.id);
    await refresh();
  }

  async function handleSaveEditRub() {
    if (!editRub?.titre.trim()) return;
    await updateRubrique(editRub.id, { titre: editRub.titre.trim() });
    setEditRub(null);
    await refresh();
  }

  // ── Articles ────────────────────────────────────────────────────────────────

  function openNewArticle(rubriqueId: string) {
    setEditArticleId(null);
    setArticleForm(emptyForm(rubriqueId));
  }

  function openEditArticle(a: MarketplaceArticle) {
    setEditArticleId(a.id);
    setArticleForm({
      rubriqueId: a.rubriqueId,
      titre: a.titre,
      excerpt: a.excerpt ?? "",
      content: a.content ?? "",
      coverImageUrl: a.coverImageUrl ?? "",
      lien: a.lien ?? "",
      slug: a.slug
    });
  }

  function handleTitreChange(titre: string) {
    if (!articleForm) return;
    setArticleForm(f => f ? ({
      ...f,
      titre,
      slug: editArticleId ? f.slug : makeSlug(titre) // Ne pas changer le slug en édition
    }) : null);
  }

  async function handleSaveArticle() {
    if (!articleForm || !articleForm.titre.trim()) return;
    setSaving(true);
    try {
      const payload = {
        rubriqueId: articleForm.rubriqueId,
        titre: articleForm.titre.trim(),
        excerpt: articleForm.excerpt.trim() || undefined,
        content: articleForm.content || undefined,
        coverImageUrl: articleForm.coverImageUrl.trim() || undefined,
        lien: articleForm.lien.trim() || undefined,
        slug: articleForm.slug || makeSlug(articleForm.titre),
        active: true,
        ordre: articles.filter(a => a.rubriqueId === articleForm.rubriqueId).length + 1
      };

      if (editArticleId) {
        await updateArticle(editArticleId, payload);
      } else {
        await createArticle(payload);
      }
      setArticleForm(null);
      setEditArticleId(null);
      await refresh();
    } finally { setSaving(false); }
  }

  async function handleToggleArticle(a: MarketplaceArticle) {
    await updateArticle(a.id, { active: !a.active });
    await refresh();
  }

  async function handleDeleteArticle(a: MarketplaceArticle) {
    if (!confirm(`Supprimer "${a.titre}" ?`)) return;
    await deleteArticle(a.id);
    await refresh();
  }

  return (
    <SuperAdminGate require="canAccessAdmin">
      <div className="space-y-6">
        <PageHeader
          title="Contenu marketplace"
          description="Créez des rubriques et articles visibles sous les annonces sur la marketplace."
        />

        {/* Nouvelle rubrique */}
        <Card>
          <p className="mb-3 text-sm font-semibold text-sobaya-ink">Nouvelle rubrique</p>
          <div className="flex gap-2">
            <Input
              value={newRubTitre}
              onChange={e => setNewRubTitre(e.target.value)}
              placeholder="Ex : Bons plans, Découvertes, Vie de quartier..."
              onKeyDown={e => e.key === "Enter" && handleAddRubrique()}
            />
            <Button onClick={handleAddRubrique} disabled={addingRub || !newRubTitre.trim()}>
              <Plus size={15} /> Ajouter
            </Button>
          </div>
        </Card>

        {loading ? (
          <p className="text-sm text-sobaya-muted">Chargement...</p>
        ) : rubriques.length === 0 ? (
          <p className="text-sm text-sobaya-muted">Aucune rubrique. Créez-en une ci-dessus.</p>
        ) : (
          <div className="space-y-3">
            {rubriques.map(r => {
              const rArticles = articles.filter(a => a.rubriqueId === r.id);
              const isOpen = openRubrique === r.id;
              const isFormOpen = articleForm?.rubriqueId === r.id;

              return (
                <Card key={r.id}>
                  {/* En-tête rubrique */}
                  <div className="flex items-center gap-3">
                    {editRub?.id === r.id ? (
                      <div className="flex flex-1 gap-2">
                        <Input value={editRub.titre} onChange={e => setEditRub({ ...editRub, titre: e.target.value })} />
                        <Button onClick={handleSaveEditRub}>Enregistrer</Button>
                        <Button variant="secondary" onClick={() => setEditRub(null)}>Annuler</Button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setOpenRubrique(isOpen ? null : r.id)} className="flex flex-1 items-center gap-2 text-left">
                          {isOpen ? <ChevronUp size={16} className="text-sobaya-muted" /> : <ChevronDown size={16} className="text-sobaya-muted" />}
                          <span className="font-medium text-sobaya-ink">{r.titre}</span>
                          <span className="text-xs text-sobaya-muted">({rArticles.length} article{rArticles.length > 1 ? "s" : ""})</span>
                        </button>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {r.active ? "Publié" : "Masqué"}
                        </span>
                        <button onClick={() => handleToggleRubrique(r)} className="p-1.5 text-sobaya-muted hover:text-sobaya-ink" title={r.active ? "Masquer" : "Publier"}>
                          {r.active ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => setEditRub({ id: r.id, titre: r.titre })} className="p-1.5 text-sobaya-muted hover:text-sobaya-ink">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteRubrique(r)} className="p-1.5 text-red-400 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Articles */}
                  {isOpen && (
                    <div className="mt-4 space-y-2 border-t border-sobaya-border pt-4">
                      {rArticles.length === 0 && !isFormOpen && (
                        <p className="text-xs text-sobaya-muted">Aucun article dans cette rubrique.</p>
                      )}

                      {rArticles.map(a => (
                        <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-sobaya-soft px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-sobaya-ink">{a.titre}</p>
                            {a.excerpt && <p className="mt-0.5 text-xs text-sobaya-muted line-clamp-1">{a.excerpt}</p>}
                            <div className="mt-1 flex items-center gap-3 text-[11px] text-sobaya-muted">
                              {a.content && <span className="text-emerald-600">✓ Contenu rédigé</span>}
                              {a.coverImageUrl && <span>🖼 Photo</span>}
                              {a.lien && <span>🔗 Lien</span>}
                              <span className="font-mono text-sobaya-border">/magazine/{a.slug}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${a.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                              {a.active ? "Visible" : "Masqué"}
                            </span>
                            <button onClick={() => handleToggleArticle(a)} className="p-1 text-sobaya-muted hover:text-sobaya-ink">
                              {a.active ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => { openEditArticle(a); setOpenRubrique(r.id); }} className="p-1 text-sobaya-muted hover:text-sobaya-ink">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteArticle(a)} className="p-1 text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Formulaire article */}
                      {isFormOpen && articleForm ? (
                        <div className="rounded-2xl border border-sobaya-primary/20 bg-white p-5 space-y-4 mt-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-sobaya-ink">
                              {editArticleId ? "Modifier l'article" : "Nouvel article"}
                            </p>
                            <button onClick={() => { setArticleForm(null); setEditArticleId(null); }} className="text-sobaya-muted hover:text-sobaya-ink">
                              <X size={16} />
                            </button>
                          </div>

                          <FormField label="Titre" required>
                            <Input
                              value={articleForm.titre}
                              onChange={e => handleTitreChange(e.target.value)}
                              placeholder="Ex : Faire du VTT à Abidjan"
                            />
                          </FormField>

                          <FormField label="Résumé" help="Une ligne affichée sous le titre dans la liste">
                            <Input
                              value={articleForm.excerpt}
                              onChange={e => setArticleForm(f => f ? ({ ...f, excerpt: e.target.value }) : null)}
                              placeholder="Ex : Découvrez les meilleurs circuits autour d'Abidjan"
                            />
                          </FormField>

                          <FormField label="URL slug" help="Adresse de la page article — générée automatiquement">
                            <Input
                              value={articleForm.slug}
                              onChange={e => setArticleForm(f => f ? ({ ...f, slug: makeSlug(e.target.value) }) : null)}
                              placeholder="faire-du-vtt-a-abidjan"
                            />
                          </FormField>

                          <FormField label="Photo de couverture" help="Optionnel — coller une URL d'image">
                            <Input
                              value={articleForm.coverImageUrl}
                              onChange={e => setArticleForm(f => f ? ({ ...f, coverImageUrl: e.target.value }) : null)}
                              placeholder="https://..."
                            />
                          </FormField>

                          {articleForm.coverImageUrl && (
                            <div className="overflow-hidden rounded-xl border border-sobaya-border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={articleForm.coverImageUrl} alt="Aperçu" className="h-32 w-full object-cover" />
                            </div>
                          )}

                          <FormField label="Lien externe" help="Optionnel — si renseigné, le clic redirige ici au lieu d'ouvrir la page article">
                            <Input
                              value={articleForm.lien}
                              onChange={e => setArticleForm(f => f ? ({ ...f, lien: e.target.value }) : null)}
                              placeholder="https://..."
                            />
                          </FormField>

                          <FormField label="Contenu de l'article" help="Optionnel — rédigez le texte complet de l'article">
                            <RichEditor
                              content={articleForm.content}
                              onChange={html => setArticleForm(f => f ? ({ ...f, content: html }) : null)}
                            />
                          </FormField>

                          <div className="flex gap-2 pt-2">
                            <Button onClick={handleSaveArticle} disabled={saving || !articleForm.titre.trim()}>
                              {saving ? "Enregistrement..." : editArticleId ? "Mettre à jour" : "Publier l'article"}
                            </Button>
                            <Button variant="secondary" onClick={() => { setArticleForm(null); setEditArticleId(null); }}>
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => openNewArticle(r.id)}
                          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-sobaya-border px-4 py-2.5 text-xs text-sobaya-muted hover:border-sobaya-primary hover:text-sobaya-primary transition"
                        >
                          <Plus size={13} /> Ajouter un article
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SuperAdminGate>
  );
}
