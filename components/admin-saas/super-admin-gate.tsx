"use client";

import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";
import { getGlobalAccess } from "@/constants/global-roles";
import type { GlobalRole } from "@/types/user";

type AccessKey = keyof ReturnType<typeof getGlobalAccess>;

export function SuperAdminGate({
  children,
  require = "canAccessAdmin"
}: {
  children: React.ReactNode;
  require?: AccessKey;
}) {
  const { profile, loading } = useAuth();

  if (loading) return <Card><p className="text-sm text-sobaya-muted">Chargement des droits administrateur...</p></Card>;

  const role = (profile?.globalRole ?? "user") as GlobalRole;
  const access = getGlobalAccess(role);

  if (!access[require]) {
    return (
      <Card>
        <div className="flex gap-3">
          <ShieldAlert className="mt-1 text-amber-600" size={22} />
          <div>
            <p className="font-medium">Accès insuffisant</p>
            <p className="mt-1 text-sm text-sobaya-muted">
              Votre rôle ({role}) ne permet pas d&apos;accéder à cette section.
              Contactez un administrateur plateforme ou le super admin.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
