export type PaymentMethod = "cash" | "orange_money" | "wave" | "bank_transfer" | "check" | "other";
export type PaymentStatus = "completed" | "partial" | "pending" | "cancelled";

export interface Payment {
  id: string;
  organizationId: string;
  contractId: string;
  contractNumber: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  ownerMandateId?: string;
  ownerName?: string;
  agencyCommissionAmount?: number;
  ownerNetAmount?: number;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  periodLabel?: string;
  periodMonths?: number;
  expectedAmount?: number;
  remainingBalance?: number;
  overpaidAmount?: number;
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  status: PaymentStatus;
  receiptNumber: string;
  receiptPdfUrl?: string;
  receiptIssuedAt?: unknown;
  receiptIssuedBy?: string | null;
  verificationCode?: string;
  notes: string;
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
  createdBy?: string | null;
}

export type PaymentFormValues = Pick<Payment, "contractId" | "paymentDate" | "periodStart" | "periodEnd" | "amount" | "paymentMethod" | "reference" | "status" | "notes">;
