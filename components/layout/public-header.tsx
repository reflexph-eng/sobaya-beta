import { ButtonLink } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";

export function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
      <div>
        <BrandLogo priority />
        <p className="mt-1 text-xs text-sobaya-muted">Votre patrimoine. Sous contrôle.</p>
      </div>
      <div className="flex items-center gap-2">
        <ButtonLink href="/login" variant="ghost">Connexion</ButtonLink>
        <ButtonLink href="/register">Démarrer</ButtonLink>
      </div>
    </header>
  );
}
