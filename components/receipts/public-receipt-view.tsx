"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Printer, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildReceiptUrl, getPublicReceipt, type PublicReceipt } from "@/services/receipts";
import { ReceiptQrCode } from "@/components/receipts/qr-code";
import { BrandLogo } from "@/components/layout/brand-logo";

const methodLabels: Record<string, string> = {
  cash: "Espèces",
  orange_money: "Orange Money",
  wave: "Wave",
  bank_transfer: "Virement",
  check: "Chèque",
  other: "Autre"
};

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

function downloadHtml(receipt: PublicReceipt) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${receipt.receiptNumber}</title></head><body><h1>QUITTANCE DE LOYER</h1><p>Numéro : ${receipt.receiptNumber}</p><p>Locataire : ${receipt.tenantName}</p><p>Bien : ${receipt.propertyName}</p><p>Contrat : ${receipt.contractNumber}</p><p>Montant : ${money(receipt.amount)}</p><p>Date : ${receipt.paymentDate}</p><p>Code : ${receipt.verificationCode}</p></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${receipt.receiptNumber}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function PublicReceiptView({ receiptNumber }: { receiptNumber: string }) {
  const [receipt, setReceipt] = useState<PublicReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const verifyUrl = useMemo(() => buildReceiptUrl(receipt?.receiptNumber ?? receiptNumber), [receipt?.receiptNumber, receiptNumber]);

  useEffect(() => {
    getPublicReceipt(receiptNumber)
      .then(setReceipt)
      .catch(() => setError("Quittance introuvable ou non encore publiée."))
      .finally(() => setLoading(false));
  }, [receiptNumber]);

  if (loading) return <main className="min-h-screen bg-white p-6 text-sobaya-ink"><p>Chargement de la quittance...</p></main>;

  if (error || !receipt) {
    return (
      <main className="min-h-screen bg-white p-6 text-sobaya-ink">
        <div className="mx-auto max-w-2xl">
          <Card className="text-center">
            <XCircle className="mx-auto text-red-500" size={44} />
            <h1 className="mt-4 text-2xl font-semibold">Quittance introuvable</h1>
            <p className="mt-2 text-sm text-sobaya-muted">Le numéro demandé n&apos;existe pas ou la quittance n&apos;a pas encore été générée.</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sobaya-soft p-4 text-sobaya-ink print:bg-white">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <BrandLogo />
            <h1 className="mt-3 text-2xl font-semibold">Vérification de quittance</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadHtml(receipt)}><Download size={16} /> Télécharger</Button>
            <Button onClick={() => window.print()}><Printer size={16} /> Imprimer / PDF</Button>
          </div>
        </div>

        <Card className="bg-white print:border-0 print:shadow-none">
          <div className="flex flex-col gap-4 border-b border-sobaya-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <BrandLogo />
              <h2 className="mt-4 text-3xl font-semibold">QUITTANCE DE LOYER</h2>
              <p className="mt-2 text-sm text-sobaya-muted">Votre patrimoine. Sous contrôle.</p>
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
              <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 size={18} /> Quittance valide</div>
              <p className="mt-1 text-xs">Code : {receipt.verificationCode}</p>
            </div>
          </div>

          <div className="grid gap-4 py-6 sm:grid-cols-2">
            <Info label="Numéro de quittance" value={receipt.receiptNumber} />
            <Info label="Date du paiement" value={receipt.paymentDate} />
            <Info label="Locataire" value={receipt.tenantName} />
            <Info label="Bien" value={receipt.propertyName} />
            <Info label="Contrat" value={receipt.contractNumber} />
            <Info label="Mode de paiement" value={methodLabels[receipt.paymentMethod] ?? receipt.paymentMethod} />
            <Info label="Référence" value={receipt.reference || "Non renseignée"} />
            <Info label="Montant reçu" value={money(receipt.amount)} strong />
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-sobaya-border bg-sobaya-soft p-4 sm:flex-row sm:items-center sm:justify-between print:bg-white">
            <div>
              <div className="flex items-center gap-2 font-medium"><ShieldCheck size={18} /> Vérification publique</div>
              <p className="mt-2 text-sm leading-6 text-sobaya-muted">Scannez le code ou consultez le lien public pour confirmer l&apos;authenticité de cette quittance.</p>
              <p className="mt-2 break-all text-xs text-sobaya-muted">{verifyUrl}</p>
            </div>
            <ReceiptQrCode value={verifyUrl} />
          </div>
        </Card>
      </div>
    </main>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-sobaya-muted">{label}</p>
      <p className={strong ? "mt-1 text-2xl font-semibold" : "mt-1 font-medium"}>{value}</p>
    </div>
  );
}
