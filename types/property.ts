export type PropertyType = "apartment" | "house" | "studio" | "office" | "store" | "land" | "other";
export type PropertyStatus = "available" | "occupied" | "maintenance" | "archived";

export interface Property {
  id: string;
  organizationId: string;
  name: string;
  reference: string;
  type: PropertyType;
  city: string;
  commune: string;
  address: string;
  description: string;
  rooms: number;
  monthlyRent: number;
  charges: number;
  status: PropertyStatus;
  photos: string[];
  isDeleted?: boolean;
  deletedAt?: unknown;
  deletedBy?: string | null;
  createdAt: Date | unknown;
  updatedAt: Date | unknown;
}

export interface PropertyFormValues {
  name: string;
  reference: string;
  type: PropertyType;
  city: string;
  commune: string;
  address: string;
  description: string;
  rooms: number;
  monthlyRent: number;
  charges: number;
  status: PropertyStatus;
}
