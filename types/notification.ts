export type NotificationType =
  | "payment_received"
  | "payment_partial"
  | "payment_overdue"
  | "contract_expiring"
  | "contract_expired"
  | "maintenance_created"
  | "maintenance_assigned"
  | "intervention_completed"
  | "provider_assigned"
  | "system";

export type NotificationEntityType = "payment" | "contract" | "maintenance" | "intervention" | "provider" | "organization" | "system";

export interface SobayaNotification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  entityLabel: string;
  isRead: boolean;
  severity: "info" | "success" | "warning" | "danger";
  createdAt: unknown;
  readAt?: unknown;
}

export interface NotificationPayload {
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  entityLabel?: string;
  severity?: SobayaNotification["severity"];
}
