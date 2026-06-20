import { Card } from "@/components/ui/card";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <Card className="w-full max-w-md">
        <p className="text-2xl font-semibold">Finaliser votre espace</p>
        <p className="mt-2 text-sm text-sobaya-muted">Créez ou rattachez votre organisation pour accéder au tableau de bord SOBAYA.</p>
        <OnboardingForm />
      </Card>
    </main>
  );
}
