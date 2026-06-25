"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Printer, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildReceiptUrl, getPublicReceipt, type PublicReceipt } from "@/services/receipts";
import { ReceiptQrCode } from "@/components/receipts/qr-code";
import { BrandLogo } from "@/components/layout/brand-logo";

const FALLBACK_ISSUER = "Gestionnaire non renseigné";

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

function safeText(value: string | undefined | null) {
  return String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] ?? char));
}

function qrImageUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(value)}`;
}

/**
 * Résout le nom de l'émetteur pour l'affichage.
 * Protège contre les quittances historiques dont organizationName
 * était absent ou valait "SOBAYA".
 */
function resolveDisplayIssuer(receipt: PublicReceipt): string {
  const name = receipt.organizationName?.trim();
  if (name && name !== "SOBAYA") return name;
  return FALLBACK_ISSUER;
}

function downloadPrintableReceipt(receipt: PublicReceipt, verifyUrl: string) {
  const issuerName = resolveDisplayIssuer(receipt);
  const periodLabel = receipt.periodLabel || "Période non renseignée";
  const expectedAmount = Number(receipt.expectedAmount) || Number(receipt.amount) || 0;
  const remainingBalance = Number(receipt.remainingBalance) || 0;
  const overpaidAmount = Number(receipt.overpaidAmount) || 0;

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${safeText(receipt.receiptNumber)}</title><style>
  body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f6f7f5;color:#102019}.page{max-width:850px;margin:30px auto;background:white;padding:36px;border:1px solid #dde5dd}.top{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #0b6b4b;padding-bottom:24px}.brand{font-size:28px;font-weight:800;letter-spacing:4px;color:#0b6b4b}.title{margin-top:28px;font-size:30px;font-weight:800}.badge{border:1px solid #b7dec9;background:#eefaf2;color:#145c35;padding:12px 16px;border-radius:14px;font-weight:700}.period{margin-top:18px;border:1px solid #b7dec9;background:#f0faf4;border-radius:16px;padding:16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:28px 0}.box{border:1px solid #e2e8e2;border-radius:14px;padding:16px}.label{font-size:11px;text-transform:uppercase;color:#6b756f;letter-spacing:1.5px}.value{margin-top:6px;font-size:16px;font-weight:700}.amount{font-size:30px;color:#0b6b4b}.table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #e2e8e2;padding:12px;text-align:left}th{background:#f6f7f5;font-size:12px;text-transform:uppercase;color:#6b756f}.verify{display:flex;justify-content:space-between;gap:24px;align-items:center;margin-top:26px;border:1px solid #e2e8e2;border-radius:16px;padding:18px;background:#f8faf8}.qr{width:150px;height:150px;border:1px solid #e2e8e2;padding:8px;background:white}.foot{margin-top:24px;font-size:12px;color:#6b756f;line-height:1.7}@media print{body{background:white}.page{margin:0;max-width:none;border:0}}</style></head><body><main class="page"><div class="top"><div><div class="brand">${safeText(issuerName)}</div><div style="margin-top:8px;color:#6b756f">Votre patrimoine. Sous contrôle.</div></div><div class="badge">Quittance valide<br><small>Code : ${safeText(receipt.verificationCode)}</small></div></div><div class="title">QUITTANCE DE LOYER</div><section class="period"><div class="label">Période couverte</div><div class="value">${safeText(periodLabel)}</div></section><div class="grid"><div class="box"><div class="label">Numéro</div><div class="value">${safeText(receipt.receiptNumber)}</div></div><div class="box"><div class="label">Date du paiement</div><div class="value">${safeText(receipt.paymentDate)}</div></div><div class="box"><div class="label">Locataire</div><div class="value">${safeText(receipt.tenantName)}</div></div><div class="box"><div class="label">Bien loué</div><div class="value">${safeText(receipt.propertyName)}</div></div><div class="box"><div class="label">Contrat</div><div class="value">${safeText(receipt.contractNumber)}</div></div><div class="box"><div class="label">Montant reçu</div><div class="value amount">${money(receipt.amount)}</div></div></div><table class="table"><thead><tr><th>Désignation</th><th>Période</th><th>Attendu</th><th>Reçu</th><th>Solde</th></tr></thead><tbody><tr><td>Paiement de loyer</td><td>${safeText(periodLabel)}</td><td>${money(expectedAmount)}</td><td>${money(receipt.amount)}</td><td>${remainingBalance > 0 ? money(remainingBalance) : overpaidAmount > 0 ? `Trop-perçu ${money(overpaidAmount)}` : "Soldé"}</td></tr></tbody></table><table class="table"><tbody><tr><th>Mode</th><td>${safeText(methodLabels[receipt.paymentMethod] ?? receipt.paymentMethod)}</td><th>Référence</th><td>${safeText(receipt.reference || "Non renseignée")}</td></tr></tbody></table><section class="verify"><div><strong>Vérification publique</strong><p>${safeText(verifyUrl)}</p></div><img class="qr" src="${qrImageUrl(verifyUrl)}" alt="QR Code de vérification"></section><p class="foot">Cette quittance a été émise par ${safeText(issuerName)}. Elle peut être vérifiée avec le QR code ou le lien public ci-dessus.</p></main></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${receipt.receiptNumber}-quittance.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function PublicReceiptView({ receiptNumber }: { receiptNumber: string }) {
  const [receipt, setReceipt] = useState<PublicReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const verifyUrl = useMemo(() => buildReceiptUrl(receipt?.receiptNumber ?? receiptNumber), [receipt?.receiptNumber, receiptNumber]);

  // Charge la quittance fraîche depuis Firestore à chaque ouverture de la page
  useEffect(() => {
    setLoading(true);
    getPublicReceipt(receiptNumber)
      .then(setReceipt)
      .catch(() => setError("Quittance introuvable ou non encore publiée."))
      .finally(() => setLoading(false));
  }, [receiptNumber]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6 text-sobaya-ink">
        <p>Chargement de la quittance...</p>
      </main>
    );
  }

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

  // Nom résolu une fois pour toute la vue et le téléchargement
  const issuerName = resolveDisplayIssuer(receipt);

  return (
    <main className="min-h-screen bg-sobaya-soft p-4 text-sobaya-ink print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl space-y-4 print:max-w-none print:space-y-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <BrandLogo />
            <h1 className="mt-3 text-2xl font-semibold">Vérification de quittance</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadPrintableReceipt(receipt, verifyUrl)}>
              <Download size={16} /> Télécharger
            </Button>
            <Button onClick={() => window.print()}><Printer size={16} /> Imprimer / PDF</Button>
          </div>
        </div>

        <Card className="bg-white p-0 print:border-0 print:shadow-none">
          <div className="overflow-hidden rounded-3xl border border-sobaya-border bg-white print:rounded-none print:border-0">
            <div className="bg-gradient-to-r from-sobaya-primary to-sobaya-primaryDark px-6 py-6 text-white sm:px-8 print:bg-white print:text-sobaya-ink">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="rounded-2xl bg-white p-3 shadow-sm print:p-0 print:shadow-none"><BrandLogo /></div>
                  <p className="mt-4 text-sm text-white/80 print:text-sobaya-muted">Votre patrimoine. Sous contrôle.</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">QUITTANCE DE LOYER</h2>
                </div>
                <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white print:border-green-200 print:bg-green-50 print:text-green-800">
                  <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={18} /> Quittance valide</div>
                  <p className="mt-1 text-xs">Code : {receipt.verificationCode}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <Info label="Numéro" value={receipt.receiptNumber} />
                <Info label="Date du paiement" value={receipt.paymentDate} />
                <Info label="Contrat" value={receipt.contractNumber} />
                <Info label="Période couverte" value={receipt.periodLabel || "Période non renseignée"} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <section className="rounded-2xl border border-sobaya-border p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-sobaya-muted">Locataire</p>
                  <h3 className="mt-2 text-xl font-semibold">{receipt.tenantName}</h3>
                  <p className="mt-3 text-sm text-sobaya-muted">Bien concerné</p>
                  <p className="mt-1 font-medium">{receipt.propertyName}</p>
                </section>
                <section className="rounded-2xl border border-sobaya-border p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-sobaya-muted">Émetteur</p>
                  <h3 className="mt-2 text-xl font-semibold">{issuerName}</h3>
                </section>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-sobaya-border">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-sobaya-soft text-xs uppercase tracking-[0.14em] text-sobaya-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Désignation</th>
                      <th className="px-4 py-3 font-medium">Période</th>
                      <th className="px-4 py-3 text-right font-medium">Attendu</th>
                      <th className="px-4 py-3 text-right font-medium">Reçu</th>
                      <th className="px-4 py-3 text-right font-medium">Solde</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-sobaya-border">
                      <td className="px-4 py-4 font-medium">Paiement de loyer</td>
                      <td className="px-4 py-4">{receipt.periodLabel || "Période non renseignée"}</td>
                      <td className="px-4 py-4 text-right">{money(Number(receipt.expectedAmount) || receipt.amount)}</td>
                      <td className="px-4 py-4 text-right text-lg font-semibold">{money(receipt.amount)}</td>
                      <td className="px-4 py-4 text-right">
                        {Number(receipt.remainingBalance) > 0
                          ? money(Number(receipt.remainingBalance))
                          : Number(receipt.overpaidAmount) > 0
                          ? `Trop-perçu ${money(Number(receipt.overpaidAmount))}`
                          : "Soldé"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-sobaya-border bg-sobaya-soft p-5 sm:flex-row sm:items-center sm:justify-between print:bg-white">
                <div>
                  <div className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} /> Vérification publique</div>
                  <p className="mt-2 text-sm leading-6 text-sobaya-muted">Scannez le code QR ou ouvrez le lien public pour confirmer l&apos;authenticité de cette quittance.</p>
                  <p className="mt-2 break-all text-xs text-sobaya-muted">{verifyUrl}</p>
                </div>
                <ReceiptQrCode value={verifyUrl} />
              </div>

              <p className="mt-5 text-xs leading-6 text-sobaya-muted">
                Cette quittance a été émise par <strong>{issuerName}</strong>. Le QR code permet de vérifier publiquement son authenticité.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sobaya-border p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-sobaya-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
