import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <Card className="w-full max-w-md">
        <p className="text-2xl font-semibold">Créer votre espace</p>
        <p className="mt-2 text-sm text-sobaya-muted">Un compte utilisateur crée une organisation avec abonnement d’essai.</p>
        <RegisterForm />
        <p className="mt-5 text-center text-sm text-sobaya-muted">Déjà inscrit ? <Link className="font-medium text-sobaya-primary" href="/login">Connexion</Link></p>
      </Card>
    </main>
  );
}
