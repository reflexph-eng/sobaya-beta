import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo priority />
          <p className="mt-3 text-sm text-sobaya-muted">Votre patrimoine. Sous contrôle.</p>
        </div>
        <p className="text-2xl font-semibold">Connexion</p>
        <p className="mt-2 text-sm text-sobaya-muted">Accédez à votre organisation SOBAYA.</p>
        <LoginForm />
        <p className="mt-5 text-center text-sm text-sobaya-muted">Pas encore de compte ? <Link className="font-medium text-sobaya-primary" href="/register">Créer un espace</Link></p>
      </Card>
    </main>
  );
}
