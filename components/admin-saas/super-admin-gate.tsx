"use client";

import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";

export function SuperAdminGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) return <Card><p className="text-sm text-sobaya-muted">Chargement des droits administrateur...</p></Card>;
  if (profile?.globalRole !== "super_admin") {
    return (
      <Card>
        <div className="flex gap-3">
          <ShieldAlert className="mt-1 text-amber-600" size={22} />
          <div>
            <p className="font-medium">Accès réservé au Super Admin</p>
            <p className="mt-1 text-sm text-sobaya-muted">Cette zone pilote toute la plateforme SOBAYA et n’est pas disponible pour les comptes organisation standards.</p>
          </div>
        </div>
      </Card>
    );
  }
  return <>{children}</>;
}
