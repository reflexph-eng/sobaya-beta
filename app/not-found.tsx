import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-sobaya-soft px-5 text-center">
      <BrandLogo priority />
      <p className="mt-8 text-7xl font-bold text-sobaya-primary">404</p>
      <p className="mt-4 text-xl font-semibold text-sobaya-ink">Page introuvable</p>
      <p className="mt-2 max-w-sm text-sm text-sobaya-muted">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-xl bg-sobaya-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-sobaya-primaryDark transition">
          Retour à l&apos;accueil
        </Link>
        <Link href="/dashboard" className="rounded-xl border border-sobaya-border px-6 py-2.5 text-sm font-medium text-sobaya-ink hover:bg-white transition">
          Mon dashboard
        </Link>
      </div>
      <p className="mt-12 text-xs text-sobaya-muted">sobaya.ci · Votre patrimoine. Sous contrôle.</p>
    </main>
  );
}
