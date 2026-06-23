"use client";

import { useState } from "react";
import { CheckCircle, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { saveInterventionQuote } from "@/services/interventions";
import type { InterventionQuote, MaintenanceIntervention, QuoteStatus } from "@/types/intervention";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: "En attente de réponse",
  accepted: "Accepté",
  rejected: "Refusé"
};

const QUOTE_STATUS_TONE: Record<QuoteStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700"
};

export function QuotePanel({
  organizationId,
  intervention,
  onUpdated,
  actor
}: {
  organizationId: string;
  intervention: Pick<MaintenanceIntervention, "id" | "ticketTitle" | "quote">;
  onUpdated: () => void;
  actor?: { userId?: string; userName?: string };
}) {
  const existing = intervention.quote;
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(String(existing?.amount ?? ""));
  const [status, setStatus] = useState<QuoteStatus>(existing?.status ?? "pending");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!amount || Number(amount) <= 0) {
      setError("Indiquez un montant valide.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const quote: InterventionQuote = {
        amount: Number(amount),
        status,
        notes: notes.trim() || null,
        sentAt: existing?.sentAt ?? new Date().toISOString(),
        respondedAt: status !== "pending" ? new Date().toISOString() : existing?.respondedAt ?? null,
        fileUrl: existing?.fileUrl ?? null,
        storagePath: existing?.storagePath ?? null
      };
      await saveInterventionQuote(organizationId, intervention.id, intervention.ticketTitle, quote, actor);
      onUpdated();
      setShowForm(false);
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border-t border-sobaya-border pt-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-sobaya-ink">
          <FileText size={15} /> Devis
        </p>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {existing ? "Modifier le devis" : "Enregistrer un devis"}
        </Button>
      </div>

      {/* Affichage du devis existant */}
      {existing && !showForm ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-sobaya-border p-3">
            <span className="font-semibold text-sobaya-ink">{money(existing.amount)}</span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${QUOTE_STATUS_TONE[existing.status]}`}>
              {existing.status === "accepted" ? <><CheckCircle size={12} className="inline mr-1" /></> : existing.status === "rejected" ? <><XCircle size={12} className="inline mr-1" /></> : null}
              {QUOTE_STATUS_LABELS[existing.status]}
            </span>
          </div>
          {existing.notes ? <p className="text-xs text-sobaya-muted italic">{existing.notes}</p> : null}
        </div>
      ) : null}

      {!existing && !showForm ? (
        <p className="mt-2 text-xs text-sobaya-muted">Aucun devis enregistré pour cette intervention.</p>
      ) : null}

      {/* Formulaire de devis */}
      {showForm ? (
        <div className="mt-3 space-y-3 rounded-xl border border-sobaya-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Montant du devis (FCFA)" required>
              <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ex : 150000" />
            </FormField>
            <SelectField label="Statut" value={status} onChange={(v) => setStatus(v as QuoteStatus)}>
              {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectField>
          </div>
          <FormField label="Notes" help="Détail des travaux inclus, conditions, délai...">
            <textarea
              className="min-h-16 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button disabled={saving} onClick={handleSave}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
