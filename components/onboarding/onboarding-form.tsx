"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { createStarterOrganization } from "@/services/organizations";

export function OnboardingForm() {
  const router = useRouter();
  const { firebaseUser, profile, refreshSession } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firebaseUser) return;
    setLoading(true);
    const organizationId = await createStarterOrganization({
      userId: firebaseUser.uid,
      name: organizationName,
      email: firebaseUser.email ?? profile?.email ?? "",
      displayName: firebaseUser.displayName ?? profile?.displayName ?? ""
    });

    await setDoc(doc(db, "users", firebaseUser.uid), {
      displayName: firebaseUser.displayName ?? profile?.displayName ?? "Utilisateur SOBAYA",
      email: firebaseUser.email ?? profile?.email ?? "",
      globalRole: profile?.globalRole ?? "user",
      activeOrganizationId: organizationId,
      createdAt: profile?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    await refreshSession();
    router.replace("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <FormField label="Nom de votre organisation" required help="Cet espace portera vos biens, locataires, contrats et paiements.">
        <Input placeholder="Ex : Agence Immobilière Horizon" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required />
      </FormField>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "Configuration..." : "Finaliser mon espace"}</Button>
    </form>
  );
}
