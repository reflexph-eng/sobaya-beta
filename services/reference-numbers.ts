import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type ReferenceEntity = "property" | "tenant" | "contract" | "ownerMandate" | "booking";

const REFERENCE_CONFIG: Record<ReferenceEntity, { collectionName: string; fieldName: string; prefix: string }> = {
  property: { collectionName: "properties", fieldName: "reference", prefix: "SBY-BIEN" },
  tenant: { collectionName: "tenants", fieldName: "tenantNumber", prefix: "SBY-LOC" },
  contract: { collectionName: "contracts", fieldName: "contractNumber", prefix: "SBY-CTR" },
  ownerMandate: { collectionName: "ownerMandates", fieldName: "ownerNumber", prefix: "SBY-PRO" },
  booking: { collectionName: "bookings", fieldName: "bookingNumber", prefix: "SBY-RES" }
};

function readReferenceNumber(value: unknown, prefix: string) {
  if (typeof value !== "string") return 0;
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(new RegExp(`^${prefix}-(\\d+)$`));
  return match ? Number(match[1]) || 0 : 0;
}

function formatReference(prefix: string, number: number) {
  return `${prefix}-${String(number).padStart(4, "0")}`;
}

export async function generateNextReference(organizationId: string, entity: ReferenceEntity) {
  const config = REFERENCE_CONFIG[entity];
  const snapshot = await getDocs(query(collection(db, "organizations", organizationId, config.collectionName)));
  let maxNumber = 0;
  snapshot.forEach((item) => {
    const data = item.data();
    if (data.isDeleted === true) return;
    maxNumber = Math.max(maxNumber, readReferenceNumber(data[config.fieldName], config.prefix));
  });
  return formatReference(config.prefix, maxNumber + 1);
}

export async function ensureReference(organizationId: string, entity: ReferenceEntity, currentValue?: string | null) {
  const value = (currentValue ?? "").trim();
  if (value) return value;
  return generateNextReference(organizationId, entity);
}
