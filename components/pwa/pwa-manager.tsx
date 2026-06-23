"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Enregistrement du Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SOBAYA SW enregistré:", registration.scope);
        })
        .catch((err) => {
          console.warn("SW non enregistré:", err);
        });
    }

    // Capture de l'événement d'installation PWA
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Afficher la bannière seulement si pas déjà installé
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!isStandalone) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Détection si déjà installé
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowBanner(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShowBanner(false);
    }
  }

  if (!showBanner || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-sobaya-border bg-white p-4 shadow-lg sm:left-auto sm:right-6 sm:max-w-xs">
      <button
        type="button"
        onClick={() => setShowBanner(false)}
        className="absolute right-3 top-3 text-sobaya-muted hover:text-sobaya-ink"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <img src="/icons/icon-96x96.png" alt="SOBAYA" className="h-12 w-12 rounded-xl" />
        <div>
          <p className="text-sm font-semibold text-sobaya-ink">Installer SOBAYA</p>
          <p className="mt-0.5 text-xs text-sobaya-muted">Accédez à votre tableau de bord directement depuis votre écran d&apos;accueil.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sobaya-primary px-4 py-2 text-sm font-medium text-white hover:bg-sobaya-primaryDark"
      >
        <Download size={15} /> Installer l&apos;application
      </button>
    </div>
  );
}
