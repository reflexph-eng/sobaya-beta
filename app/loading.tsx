import { BrandLogo } from "@/components/layout/brand-logo";

export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
      <BrandLogo variant="icon" priority />
      <div className="mt-6 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-sobaya-primary animate-bounce [animation-delay:-0.3s]" />
        <div className="h-2 w-2 rounded-full bg-sobaya-primary animate-bounce [animation-delay:-0.15s]" />
        <div className="h-2 w-2 rounded-full bg-sobaya-primary animate-bounce" />
      </div>
      <p className="mt-4 text-sm text-sobaya-muted">Chargement en cours...</p>
    </main>
  );
}
