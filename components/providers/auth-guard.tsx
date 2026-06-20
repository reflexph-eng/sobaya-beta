"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLogo } from "@/components/layout/brand-logo";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { firebaseUser, profile, organization, member, loading } = useAuth();

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

  return <>{children}</>;
}
