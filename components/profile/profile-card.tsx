"use client";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";

export function ProfileCard() {
  const { profile, organization, member } = useAuth();
  return (
    <Card className="mt-6 max-w-2xl">
      <div className="space-y-3 text-sm">
        <p><span className="text-sobaya-muted">Nom :</span> {profile?.displayName}</p>
        <p><span className="text-sobaya-muted">Email :</span> {profile?.email}</p>
        <p><span className="text-sobaya-muted">Organisation active :</span> {organization?.name}</p>
        <p><span className="text-sobaya-muted">Rôle :</span> {member?.role}</p>
      </div>
    </Card>
  );
}
