"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Home, UserCog } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/auth/auth-errors";
import { createStarterOrganization } from "@/services/organizations";
import { cn } from "@/lib/utils";
import type { OrganizationType, SubscriptionPlan } from "@/types/organization";

type AccountProfile = "individual_owner" | "real_estate_agent" | "real_estate_agency";

const profileOptions: Array<{
  id: AccountProfile;
  title: string;
  description: string;
  icon: typeof Home;
  organizationType: OrganizationType;
  plan: SubscriptionPlan;
  organizationLabel: string;
  organizationPlaceholder: string;
  organizationHelp: string;
}> = [
  {
    id: "individual_owner",
    title: "Propriétaire Particulier",
    description: "Je gère mes propres biens et mes locataires.",
    icon: Home,
    organizationType: "owner",
    plan: "starter",
    organizationLabel: "Nom de votre espace propriétaire",
    organizationPlaceholder: "Ex : Patrimoine Touré",
    organizationHelp: "Cet espace représentera votre compte propriétaire SOBAYA."
  },
  {
    id: "real_estate_agent",
    title: "Agent Immobilier",
    description: "Je gère des biens pour plusieurs propriétaires.",
    icon: UserCog,
    organizationType: "real_estate_agent",
    plan: "pro",
    organizationLabel: "Nom professionnel ou cabinet",
    organizationPlaceholder: "Ex : Cabinet Horizon Immobilier",
    organizationHelp: "Préparé pour l’évolution future vers le plan Pro."
  },
  {
    id: "real_estate_agency",
    title: "Agence Immobilière",
    description: "Je travaille avec une équipe et une organisation structurée.",
    icon: Building2,
    organizationType: "agency",
    plan: "agency",
    organizationLabel: "Nom de l’agence immobilière",
    organizationPlaceholder: "Ex : Agence Immobilière Horizon",
    organizationHelp: "Préparé pour l’évolution future vers le plan Agence."
  }
];

export function RegisterForm() {
  const router = useRouter();
  const [accountProfile, setAccountProfile] = useState<AccountProfile>("individual_owner");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedProfile = useMemo(() => profileOptions.find((item) => item.id === accountProfile) ?? profileOptions[0], [accountProfile]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanName = fullName.trim();
      const cleanEmail = email.trim();
      const fallbackOrganizationName = accountProfile === "individual_owner" ? `Patrimoine ${cleanName}` : cleanName;
      const finalOrganizationName = organizationName.trim() || fallbackOrganizationName;
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(credential.user, { displayName: cleanName });
      const organizationId = await createStarterOrganization({
        userId: credential.user.uid,
        name: finalOrganizationName,
        email: cleanEmail,
        displayName: cleanName,
        type: selectedProfile.organizationType,
        subscriptionPlan: selectedProfile.plan
      });

      await setDoc(doc(db, "users", credential.user.uid), {
        displayName: cleanName,
        email: cleanEmail,
        globalRole: "user",
        activeOrganizationId: organizationId,
        accountProfile,
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
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-medium text-sobaya-ink">Vous créez un compte en tant que</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {profileOptions.map((option) => {
            const Icon = option.icon;
            const active = option.id === accountProfile;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAccountProfile(option.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  active ? "border-sobaya-primary bg-sobaya-soft ring-2 ring-sobaya-primary/10" : "border-sobaya-border bg-white hover:border-sobaya-primary/50"
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sobaya-primary shadow-sm"><Icon size={20} /></span>
                <span className="mt-3 block text-sm font-semibold text-sobaya-ink">{option.title}</span>
                <span className="mt-1 block text-xs leading-5 text-sobaya-muted">{option.description}</span>
              </button>
            );
          })}
        </div>
      </div>
      <FormField label="Nom complet" required>
        <Input placeholder="Ex : Touré Lanfia" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      </FormField>
      <FormField label={selectedProfile.organizationLabel} help={selectedProfile.organizationHelp}>
        <Input placeholder={selectedProfile.organizationPlaceholder} value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
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
