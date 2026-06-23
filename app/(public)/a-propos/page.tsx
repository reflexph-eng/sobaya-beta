import { PublicHeader } from "@/components/layout/public-header";
import { LegalFooter } from "@/components/layout/legal-footer";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-sobaya-border px-4 py-2 text-sm text-sobaya-muted">Plateforme SaaS de gestion locative africaine</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">Votre patrimoine. Sous contrôle.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-sobaya-muted md:text-lg">SOBAYA centralise vos biens, locataires, contrats, paiements et documents dans une interface simple, sécurisée et pensée pour les propriétaires et agences africaines.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register">Créer mon espace</ButtonLink>
            <ButtonLink href="/login" variant="secondary">Me connecter</ButtonLink>
            <ButtonLink href="/marketplace" variant="ghost">Voir les annonces</ButtonLink>
          </div>
        </div>
        <Card className="space-y-4">
          {[
            ["Biens", "Suivi clair de votre patrimoine"],
            ["Locataires", "Dossiers et contacts organisés"],
            ["Paiements", "Vue simple des loyers et reçus"],
            ["Organisation", "Abonnement et accès par équipe"]
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-sobaya-border p-4">
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-sobaya-muted">{description}</p>
            </div>
          ))}
        </Card>
      </section>
      <LegalFooter />
    </main>
  );
}
