export type ContractStatus = "draft" | "active" | "expired" | "suspended" | "terminated";
export type PaymentMethod = "cash" | "bank_transfer" | "mobile_money" | "check" | "other";

export type ContractOnboardingMode = "new" | "existing";

export interface Contract {
  id: string;
  organizationId: string;
  contractNumber: string;
  propertyId: string;
  propertyName: string;
  ownerMandateId?: string;
  ownerName?: string;
  managementFeeType?: "percentage" | "fixed" | "none";
  managementFeeValue?: number;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  charges: number;
  deposit: number;
  advance: number;
  dueDay: number;
  paymentMethod: PaymentMethod;
  status: ContractStatus;
  nextDueDate: string;
  balance: number;
  notes: string;
  onboardingMode?: ContractOnboardingMode;
  realContractStartDate?: string;
  migrationLastPaymentAmount?: number;
  migrationLastPaidPeriodStart?: string;
  migrationLastPaidPeriodEnd?: string;
  migrationBalance?: number;
  migrationDeposit?: number;
  migrationAdvance?: number;
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
}

export type ContractFormValues = Omit<Contract, "id" | "organizationId" | "propertyName" | "tenantName" | "nextDueDate" | "balance" | "createdAt" | "updatedAt">;
