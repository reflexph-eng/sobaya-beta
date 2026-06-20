"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { createStarterOrganization } from "@/services/organizations";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: fullName.trim() });
      const organizationId = await createStarterOrganization({
        userId: credential.user.uid,
        name: organizationName,
        email: email.trim(),
        displayName: fullName.trim()
      });

      await setDoc(doc(db, "users", credential.user.uid), {
        displayName: fullName.trim(),
        email: email.trim(),
        globalRole: "user",
        activeOrganizationId: organizationId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      router.push("/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <FormField label="Nom complet" required>
        <Input placeholder="Ex : Touré Lanfia" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      </FormField>
      <FormField label="Nom de l’organisation" required help="Votre agence, société ou espace propriétaire.">
        <Input placeholder="Ex : Agence Immobilière Horizon" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required />
      </FormField>
      <FormField label="Adresse email" required>
        <Input type="email" placeholder="Ex : contact@sobaya.ci" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </FormField>
      <FormField label="Mot de passe" required help="Minimum 6 caractères.">
        <Input type="password" placeholder="Créer un mot de passe sécurisé" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
      </FormField>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={loading}>{loading ? "Création..." : "Créer mon espace SOBAYA"}</Button>
    </form>
  );
}
