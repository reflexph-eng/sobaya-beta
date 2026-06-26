"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getPublishedArticlesByRubrique, getPublishedRubriques } from "@/services/marketplace-content";
import type { MarketplaceArticle, MarketplaceRubrique } from "@/services/marketplace-content";

export function MarketplaceEditorial() {
  const [rubriques, setRubriques] = useState<MarketplaceRubrique[]>([]);
  const [articles, setArticles] = useState<Record<string, MarketplaceArticle[]>>({});
  const [active, setActive] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPublishedRubriques().then(async rubs => {
      if (rubs.length === 0) { setLoaded(true); return; }
      const map: Record<string, MarketplaceArticle[]> = {};
      await Promise.all(rubs.map(async r => {
        map[r.id] = await getPublishedArticlesByRubrique(r.id);
      }));
      setRubriques(rubs);
      setArticles(map);
      setActive(rubs[0].id);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  if (!loaded || rubriques.length === 0) return null;

  const currentArticles = active ? (articles[active] ?? []) : [];

  return (
    <section className="mx-auto w-full max-w-screen-xl px-5 pb-12">
      <div className="rounded-3xl border border-sobaya-border bg-white px-8 py-8">

        <h2 className="text-lg font-bold text-sobaya-ink">À découvrir</h2>

        {/* Onglets rubriques */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto border-b border-sobaya-border">
          {rubriques.map(r => (
            <button
              key={r.id}
              onClick={() => setActive(r.id)}
              className={`shrink-0 px-4 pb-3 pt-1 text-sm font-medium transition-all border-b-2 -mb-px ${
                active === r.id
                  ? "border-sobaya-primary text-sobaya-primary"
                  : "border-transparent text-sobaya-muted hover:text-sobaya-ink"
              }`}
            >
              {r.titre}
            </button>
          ))}
        </div>

        {/* Articles — liste cliquable */}
        {currentArticles.length === 0 ? (
          <p className="mt-6 text-sm text-sobaya-muted">Aucun article dans cette rubrique.</p>
        ) : (
          <div className="mt-4 grid gap-x-10 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
            {currentArticles.map(a => {
              const href = a.lien || `/magazine/${a.slug}`;
              const isExternal = !!a.lien;
              return (
                <Link
                  key={a.id}
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="group flex items-start justify-between gap-2 border-b border-sobaya-border py-4 hover:border-sobaya-primary transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sobaya-ink group-hover:text-sobaya-primary transition-colors line-clamp-1">
                      {a.titre}
                    </p>
                    {a.excerpt && (
                      <p className="mt-0.5 text-xs text-sobaya-muted line-clamp-1">{a.excerpt}</p>
                    )}
                  </div>
                  <ChevronRight size={14} className="mt-0.5 shrink-0 text-sobaya-border group-hover:text-sobaya-primary transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
