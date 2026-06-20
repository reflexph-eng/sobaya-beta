"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <FormField label="Adresse email" required>
        <Input type="email" placeholder="Ex : contact@sobaya.ci" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </FormField>
      <FormField label="Mot de passe" required>
        <Input type="password" placeholder="Votre mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </FormField>
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</Button>
    </form>
  );
}
