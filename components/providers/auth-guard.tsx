"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ConsentGate } from "@/components/governance/consent-gate";
import { findMissingConsents, listUserConsents } from "@/services/governance";
import type { LegalDocumentType } from "@/types/governance";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { firebaseUser, profile, organization, member, loading } = useAuth();
  const [consentLoading, setConsentLoading] = useState(true);
  const [missingConsents, setMissingConsents] = useState<LegalDocumentType[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (!profile || !profile.activeOrganizationId || !organization || !member) {
      router.replace("/onboarding");
      return;
    }
    if (pathname === "/onboarding") {
      router.replace("/dashboard");
    }
  }, [firebaseUser, profile, organization, member, loading, pathname, router]);

  useEffect(() => {
    let mounted = true;
    if (!firebaseUser) {
      setConsentLoading(false);
      return;
    }
    listUserConsents(firebaseUser.uid)
      .then((consents) => {
        if (!mounted) return;
        setMissingConsents(findMissingConsents(consents));
      })
      .catch(() => {
        // En cas d'échec de lecture (ex. règles non encore déployées sur un environnement),
        // on ne bloque pas l'utilisateur : on considère le consentement non requis plutôt
        // que de créer un blocage d'accès total à cause d'une erreur réseau temporaire.
        if (mounted) setMissingConsents([]);
      })
      .finally(() => {
        if (mounted) setConsentLoading(false);
      });
    return () => { mounted = false; };
  }, [firebaseUser]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <div>
          <div className="flex justify-center"><BrandLogo variant="icon" priority /></div>
          <p className="mt-3 text-sm text-sobaya-muted">Chargement sécurisé de votre espace...</p>
        </div>
      </main>
    );
  }

  if (!firebaseUser || !profile || !organization || !member) return null;

  if (consentLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <div>
          <div className="flex justify-center"><BrandLogo variant="icon" priority /></div>
          <p className="mt-3 text-sm text-sobaya-muted">Vérification de vos conditions d&apos;utilisation...</p>
        </div>
      </main>
    );
  }

  if (missingConsents.length > 0) {
    return <ConsentGate userId={firebaseUser.uid} missingTypes={missingConsents} onAccepted={() => setMissingConsents([])} />;
  }

  return <>{children}</>;
}
