"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, CheckCheck, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/components/providers/auth-provider";
import { listContracts } from "@/services/contracts";
import { listPayments } from "@/services/payments";
import { generateContractReminderNotifications, listNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/services/notifications";
import type { SobayaNotification } from "@/types/notification";

function formatDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleString("fr-FR");
  }
  return "Date non disponible";
}

function tone(severity: SobayaNotification["severity"]) {
  if (severity === "success") return "success";
  if (severity === "warning") return "warning";
  if (severity === "danger") return "danger";
  return "neutral";
}

function typeLabel(type: SobayaNotification["type"]) {
  const labels: Record<SobayaNotification["type"], string> = {
    payment_received: "Paiement reçu",
    payment_partial: "Paiement partiel",
    payment_overdue: "Loyer en retard",
    contract_expiring: "Contrat à échéance",
    contract_expired: "Contrat expiré",
    maintenance_created: "Maintenance",
    maintenance_assigned: "Ticket affecté",
    intervention_completed: "Intervention terminée",
    provider_assigned: "Prestataire affecté",
    system: "Système"
  };
  return labels[type] ?? "Notification";
}

export function NotificationsManager() {
  const { organization, firebaseUser, profile } = useAuth();
  const [notifications, setNotifications] = useState<SobayaNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const actor = useMemo(() => ({ userId: firebaseUser?.uid, userName: profile?.displayName ?? profile?.email ?? "Utilisateur SOBAYA" }), [firebaseUser?.uid, profile?.displayName, profile?.email]);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    setError("");
    try {
      setNotifications(await listNotifications(organization.id));
    } catch {
      setError("Impossible de charger les notifications. Vérifiez les règles Firestore et les permissions du compte.");
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const unread = notifications.filter((item) => !item.isRead).length;
    const urgent = notifications.filter((item) => !item.isRead && item.severity === "danger").length;
    const warning = notifications.filter((item) => !item.isRead && item.severity === "warning").length;
    return { unread, urgent, warning, total: notifications.length };
  }, [notifications]);

  async function handleGenerateReminders() {
    if (!organization?.id) return;
    setGenerating(true);
    setError("");
    try {
      const [contracts, payments, existing] = await Promise.all([
        listContracts(organization.id),
        listPayments(organization.id),
        listNotifications(organization.id)
      ]);
      await generateContractReminderNotifications(organization.id, contracts, payments, existing, actor);
      await refresh();
    } catch {
      setError("Impossible de générer les rappels automatiques.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRead(notificationId: string) {
    if (!organization?.id) return;
    await markNotificationAsRead(organization.id, notificationId);
    await refresh();
  }

  async function handleReadAll() {
    if (!organization?.id) return;
    await markAllNotificationsAsRead(organization.id, notifications);
    await refresh();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description="Suivez les alertes importantes : loyers, contrats, paiements, maintenance et interventions." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Non lues" value={stats.unread} helper="Notifications à traiter" />
        <MetricCard label="Critiques" value={stats.urgent} helper="Retards ou expirations" />
        <MetricCard label="À surveiller" value={stats.warning} helper="Échéances proches" />
        <MetricCard label="Historique" value={stats.total} helper="Notifications conservées" />
      </div>

      <Card className="border-sobaya-primary/15 bg-sobaya-soft/30">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2"><Sparkles size={18} className="text-sobaya-primary" /><p className="font-medium">Génération intelligente</p></div>
            <p className="mt-1 text-sm text-sobaya-muted">Analyse les contrats actifs pour créer les alertes de loyers en retard et contrats à échéance.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={refresh} disabled={loading}><RefreshCw size={16} /> Actualiser</Button>
            <Button onClick={handleGenerateReminders} disabled={generating}><Bell size={16} /> Générer les rappels</Button>
            <Button variant="secondary" onClick={handleReadAll} disabled={stats.unread === 0}><CheckCheck size={16} /> Tout marquer lu</Button>
          </div>
        </div>
      </Card>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-sobaya-muted">Chargement des notifications...</p> : null}

      <div className="grid gap-3">
        {notifications.length === 0 && !loading ? <Card><p className="text-sm text-sobaya-muted">Aucune notification pour le moment.</p></Card> : null}
        {notifications.map((notification) => (
          <Card key={notification.id} className={!notification.isRead ? "border-sobaya-primary/30 bg-sobaya-soft/20" : ""}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={tone(notification.severity)}>{typeLabel(notification.type)}</StatusBadge>
                  {!notification.isRead ? <StatusBadge tone="success">Non lue</StatusBadge> : <StatusBadge>Lu</StatusBadge>}
                </div>
                <p className="mt-3 text-lg font-medium">{notification.title}</p>
                <p className="mt-1 text-sm leading-6 text-sobaya-muted">{notification.message}</p>
                <p className="mt-2 text-xs text-sobaya-muted">{notification.entityLabel} · {formatDate(notification.createdAt)}</p>
              </div>
              {!notification.isRead ? <Button variant="secondary" onClick={() => handleRead(notification.id)}><Check size={16} /> Marquer lu</Button> : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
