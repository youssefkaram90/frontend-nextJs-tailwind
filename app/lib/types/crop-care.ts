// ============================================================
// Crop Care + Phytosanitary types — aligned with the backend
// ============================================================

/**
 * The three things a crop-care operation — or a scheduled plan — can be.
 *
 * `FERTILISATION` joined on 2026-09-29 (P6-07): applying fertiliser is a logged
 * operation exactly like a treatment, and it takes fertiliser stock out the same
 * way. Both name a product and a quantity; **irrigation names neither**.
 */
export type CropCareType = "IRRIGATION" | "TREATMENT" | "FERTILISATION";

/**
 * The label for any of the three, in **one** place, so no two screens can end up
 * calling the same thing something different.
 */
export function cropCareTypeLabel(type: string): string {
  switch (type) {
    case "IRRIGATION":
      return "Irrigation";
    case "FERTILISATION":
      return "Fertilisation";
    default:
      return "Treatment";
  }
}

export interface PhytosanitaryProduct {
  id: string;
  name: string;
  activeIngredient: string | null;
  category: string | null;
  unit: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhytosanitaryProgram {
  id: string;
  name: string;
  active: boolean;
  notes: string | null;
  entries: { id: string; product: PhytosanitaryProduct }[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationTarget {
  targetType: "TUNNEL" | "SECTOR";
  tunnelId?: string;
  sectorId?: string;
}

export interface CropOperationLocation {
  id: string;
  targetType: "TUNNEL" | "SECTOR";
  tunnelId: string | null;
  tunnel: { id: string; number: string } | null;
  sectorId: string | null;
  sector: { id: string; name: string } | null;
}

export interface CropOperation {
  id: string;
  operationType: CropCareType;
  productId: string | null;
  product: PhytosanitaryProduct | null;
  source: "MANUAL" | "PLAN";
  planEntryId: string | null;
  planEntry: { plan: { id: string; name: string } } | null;
  quantity: number | null;
  performedAt: string;
  notes: string | null;
  createdBy: string | null;
  locations: CropOperationLocation[];
  createdAt: string;
  updatedAt: string;
}

export interface CropCarePlanEntry {
  id: string;
  plannedDate: string;
  productId: string | null;
  product: PhytosanitaryProduct | null;
  quantity: number | null;
  notes: string | null;
  status: "PLANNED" | "EXECUTED";
  executedAt: string | null;
  executedBy: string | null;
}

export interface CropCarePlan {
  id: string;
  planType: CropCareType;
  name: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  locations: CropOperationLocation[];
  entries: CropCarePlanEntry[];
  entryCount?: number;
  executedCount?: number;
  progressPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceData {
  program: { id: string; name: string; notes: string | null } | null;
  products: {
    id: string;
    name: string;
    activeIngredient: string | null;
    category: string | null;
    unit: string | null;
  }[];
  locations: {
    key: string;
    targetType: string;
    targetId: string;
    name: string;
  }[];
  /** applied[productId][locationKey] = latest performedAt (ISO) */
  applied: Record<string, Record<string, string>>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
