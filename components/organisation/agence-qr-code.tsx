"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";

// Import dynamique pour éviter les erreurs SSR (QRCodeSVG utilise le DOM)
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  { ssr: false }
);

export function AgenceQrCode() {
  const { organization } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);

  if (!organization?.id) return null;

  // L'URL de la vitrine publique de cette organisation
  const vitrineUrl = typeof window !== "undefined"
    ? `${window.location.origin}/agence/${organization.id}`
    : `/agence/${organization.id}`;

  function handleDownload() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    // Convertit le SVG en PNG téléchargeable
    const canvas = document.createElement("canvas");
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = `qr-vitrine-${(organization?.name ?? "sobaya").replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }

  return (
    <Card className="mt-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <QrCode size={18} className="text-sobaya-primary" />
        <p className="text-lg font-medium text-sobaya-ink">Ma vitrine numérique</p>
      </div>
      <p className="text-sm text-sobaya-muted mb-5">
        Ce QR code donne accès à votre vitrine publique SOBAYA avec l&apos;ensemble de vos biens disponibles.
        Imprimez-le sur vos cartes de visite, affiches, ou partagez le lien directement.
      </p>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* QR Code */}
        <div ref={qrRef} className="flex shrink-0 flex-col items-center gap-3">
          <div className="rounded-2xl border border-sobaya-border p-4 bg-white">
            <QRCodeSVG
              value={vitrineUrl}
              size={160}
              level="M"
              includeMargin={false}
              fgColor="#0F766E"
            />
          </div>
          <Button variant="secondary" onClick={handleDownload}>
            <Download size={15} /> Télécharger (PNG)
          </Button>
        </div>

        {/* Lien et infos */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs font-medium text-sobaya-muted uppercase tracking-wide">Lien de votre vitrine</p>
            <a
              href={vitrineUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all text-sm font-medium text-sobaya-primary underline underline-offset-2"
            >
              {vitrineUrl}
            </a>
          </div>
          <div className="rounded-xl border border-sobaya-border bg-sobaya-soft p-3 text-xs text-sobaya-muted space-y-1">
            <p>✅ Accessible sans connexion par vos clients</p>
            <p>✅ Mis à jour automatiquement quand vous publiez/retirez un bien</p>
            <p>✅ Affiche vos badges de confiance SOBAYA</p>
            <p>✅ Bouton &ldquo;Créer mon espace&rdquo; pour les autres agents qui visitent votre vitrine</p>
          </div>
          <div>
            <p className="text-xs text-sobaya-muted">
              Conseil : publiez d&apos;abord des biens depuis <a href="/biens" className="underline">Biens → Publier sur la marketplace</a> pour qu&apos;ils apparaissent sur votre vitrine.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
