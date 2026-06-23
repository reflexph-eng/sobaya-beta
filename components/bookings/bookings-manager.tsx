"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarRange, Phone, Plus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookingForm } from "@/components/bookings/booking-form";
import { useAuth } from "@/components/providers/auth-provider";
import { can } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";
import { archiveBooking, createBooking, listBookings, updateBooking } from "@/services/bookings";
import { listProperties } from "@/services/properties";
import { listContracts } from "@/services/contracts";
import { BOOKING_STATUS_LABELS } from "@/types/booking";
import type { Booking, BookingFormValues, BookingStatus } from "@/types/booking";
import type { Property } from "@/types/property";
import type { Contract } from "@/types/contract";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

const statusTone: Record<BookingStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  confirmed: "success",
  checked_in: "success",
  checked_out: "neutral",
  cancelled: "danger"
};

const paymentLabels = { paid: "Payé", partial: "Paiement partiel", unpaid: "Non payé" } as const;
const paymentTone = { paid: "success", partial: "warning", unpaid: "danger" } as const;

export function BookingsManager() {
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("search") ?? "").trim().toLowerCase();
  const { firebaseUser, organization, member, profile } = useAuth();
  const permissions = member?.permissions ?? [];
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const canCreate = isSuperAdmin || can(permissions, PERMISSIONS.BOOKINGS_CREATE);
  const canUpdate = isSuperAdmin || can(permissions, PERMISSIONS.BOOKINGS_UPDATE);
  const canDelete = isSuperAdmin || can(permissions, PERMISSIONS.BOOKINGS_DELETE);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      const [bookingsData, propertiesData, contractsData] = await Promise.all([
        listBookings(organization.id),
        listProperties(organization.id),
        listContracts(organization.id).catch(() => [])
      ]);
      setBookings(bookingsData);
      setProperties(propertiesData);
      setContracts(contractsData);
    } catch {
      setError("Impossible de charger les réservations. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const furnishedProperties = useMemo(() => properties.filter((p) => p.exploitationMode === "furnished_short_term"), [properties]);

  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status === "confirmed" || b.status === "checked_in");
    const totalCollected = bookings.reduce((sum, b) => sum + Number(b.amountPaid || 0), 0);
    const pending = bookings.filter((b) => b.status === "pending").length;
    return {
      furnishedCount: furnishedProperties.length,
      activeBookings: active.length,
      pending,
      totalCollected
    };
  }, [bookings, furnishedProperties]);

  const visibleBookings = useMemo(() => {
    if (!searchTerm) return bookings;
    return bookings.filter((b) => `${b.guestName} ${b.guestPhone} ${b.propertyName} ${b.bookingNumber}`.toLowerCase().includes(searchTerm));
  }, [bookings, searchTerm]);

  async function handleSubmit(values: BookingFormValues) {
    if (!organization?.id) return;
    const property = properties.find((p) => p.id === values.propertyId);
    if (!property) {
      setError("Sélectionnez un bien valide.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateBooking(organization.id, editing.id, values, property, { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined });
      } else {
        await createBooking(organization.id, values, property, { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined });
      }
      setShowForm(false);
      setEditing(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible. Vérifiez vos permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(booking: Booking) {
    if (!organization?.id || !confirm(`Annuler/archiver la réservation ${booking.bookingNumber} ?`)) return;
    setError("");
    try {
      await archiveBooking(organization.id, booking, { userId: firebaseUser?.uid, userName: profile?.displayName ?? undefined });
      await refresh();
    } catch {
      setError("Archivage impossible. Vérifiez vos permissions.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Réservations" description="Gérez les séjours courte et moyenne durée de vos résidences meublées." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Résidences meublées" value={stats.furnishedCount} helper="Biens en mode courte/moyenne durée" />
        <MetricCard label="Séjours actifs" value={stats.activeBookings} helper="Confirmés ou en cours" />
        <MetricCard label="En attente" value={stats.pending} helper="À confirmer" />
        <MetricCard label="Montant encaissé" value={money(stats.totalCollected)} helper="Toutes réservations" />
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {furnishedProperties.length === 0 && !loading ? (
        <Card className="text-sm text-sobaya-muted">
          Aucun bien n&apos;est encore marqué « résidence meublée — courte/moyenne durée » dans sa fiche. Vous pouvez tout de même créer une réservation sur n&apos;importe quel bien, mais pensez à mettre à jour le mode d&apos;exploitation depuis la fiche du bien pour une meilleure cohérence.
        </Card>
      ) : null}

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium">Liste des réservations</p>
            <p className="text-sm text-sobaya-muted">{bookings.length} réservation(s) dans cette organisation.</p>
          </div>
          {canCreate ? <Button className="w-full sm:w-fit" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nouvelle réservation</Button> : null}
        </div>

        {showForm ? (
          <div className="mb-5 rounded-2xl border border-sobaya-border p-4">
            <BookingForm booking={editing} properties={properties} contracts={contracts} loading={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={handleSubmit} />
          </div>
        ) : null}

        {searchTerm ? <div className="mb-4"><StatusBadge>Recherche : « {searchParams.get("search")} »</StatusBadge></div> : null}

        {loading ? <p className="text-sm text-sobaya-muted">Chargement des réservations...</p> : null}

        {!loading && bookings.length === 0 ? (
          <EmptyState
            icon={<CalendarRange size={34} />}
            title="Aucune réservation enregistrée"
            description="Créez votre première réservation pour une résidence meublée."
            action={canCreate ? <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={17} /> Nouvelle réservation</Button> : null}
          />
        ) : null}

        {!loading && bookings.length > 0 && visibleBookings.length === 0 ? (
          <Card className="text-sm text-sobaya-muted">Aucune réservation ne correspond à la recherche.</Card>
        ) : null}

        <div className="grid gap-3">
          {visibleBookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-sobaya-border p-4 transition hover:bg-sobaya-soft/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{booking.guestName}</p>
                    <span className="rounded-full bg-sobaya-soft px-2 py-1 text-xs font-medium text-sobaya-muted">{booking.bookingNumber}</span>
                    <StatusBadge tone={statusTone[booking.status]}>{BOOKING_STATUS_LABELS[booking.status]}</StatusBadge>
                    <StatusBadge tone={paymentTone[booking.paymentStatus]}>{paymentLabels[booking.paymentStatus]}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-sobaya-muted">{booking.propertyName}</p>
                  <p className="mt-1 text-sm text-sobaya-muted">{booking.checkInDate} → {booking.checkOutDate} · {booking.nightsCount} nuit(s)</p>
                  <p className="mt-1 text-sm text-sobaya-muted">{money(booking.totalAmount)} · perçu {money(booking.amountPaid)}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a href={`tel:${booking.guestPhone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sobaya-border bg-white px-5 py-2 text-sm font-medium text-sobaya-ink transition hover:bg-sobaya-soft">
                    <Phone size={16} /> Appeler
                  </a>
                  {canUpdate ? <Button variant="secondary" onClick={() => { setEditing(booking); setShowForm(true); }}>Modifier</Button> : null}
                  {canDelete ? <Button variant="secondary" onClick={() => handleArchive(booking)}>Annuler</Button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
