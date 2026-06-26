import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { LegalFooter } from "@/components/layout/legal-footer";
import { getArticleBySlug } from "@/services/marketplace-content";
import { serializeFirestoreData } from "@/lib/serialize-firestore";

export const dynamic = "force-dynamic";

export default async function MagazineArticlePage({
  params
}: {
  params: { slug: string };
}) {
  let article = null;
  try {
    const raw = await getArticleBySlug(params.slug);
    article = raw ? serializeFirestoreData(raw) : null;
  } catch {}

  if (!article) notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 border-b border-sobaya-border bg-white">
        <PublicHeader />
      </div>

      <article className="mx-auto max-w-2xl px-5 pb-16 pt-8">

        {/* Retour */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-sobaya-muted hover:text-sobaya-ink transition-colors"
        >
          <ArrowLeft size={15} /> Retour à la marketplace
        </Link>

        {/* Photo de couverture */}
        {article.coverImageUrl && (
          <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl">
            <Image
              src={article.coverImageUrl}
              alt={article.titre}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Titre */}
        <h1 className="text-3xl font-bold leading-tight text-sobaya-ink">
          {article.titre}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="mt-3 text-lg leading-relaxed text-sobaya-muted">
            {article.excerpt}
          </p>
        )}

        {/* Contenu */}
        {article.content ? (
          <div
            className="prose prose-sm mt-8 max-w-none text-sobaya-ink
              prose-headings:font-bold prose-headings:text-sobaya-ink
              prose-p:text-sobaya-ink prose-p:leading-relaxed
              prose-a:text-sobaya-primary prose-a:underline
              prose-strong:text-sobaya-ink
              prose-li:text-sobaya-ink"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <p className="mt-8 text-sm text-sobaya-muted">Aucun contenu disponible pour cet article.</p>
        )}

        {/* Lien externe si présent */}
        {article.lien && (
          <div className="mt-10 rounded-2xl border border-sobaya-border bg-sobaya-soft p-5">
            <p className="text-sm font-medium text-sobaya-ink">En savoir plus</p>
            <a
              href={article.lien}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm text-sobaya-primary underline underline-offset-2 hover:text-sobaya-primaryDark"
            >
              {article.lien}
            </a>
          </div>
        )}

      </article>

      <LegalFooter />
    </main>
  );
}
