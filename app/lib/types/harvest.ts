// ============================================================
// Harvest types — aligned with the backend
// ============================================================

export interface HarvestRecord {
  id: string;
  productName: string;
  targetType: "TUNNEL" | "SECTOR";
  tunnelId: string | null;
  tunnel: { id: string; number: string } | null;
  sectorId: string | null;
  sector: { id: string; name: string } | null;
  /** 'CVT' | 'BIO' — SSM (tunnels) only; null for LPM */
  stockType: string | null;
  boxCount: number;
  plantsPerBox: number;
  /** computed = boxCount × plantsPerBox */
  totalPlants: number;
  harvestedAt: string;
  plantStockId: string | null;
  /** plant code from the box label, derived from the batch on the server */
  planteCode: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HarvestedProduct {
  id: string;
  name: string;
  /** plant code from the box label — separates two batches of one variety */
  planteCode: string;
  /**
   * Plants per box. Part of the product's identity: the same variety and code
   * packed at 410 and at 430 are separate stock lines, so a shipment can read
   * the number instead of being asked for it.
   */
  plantsPerBox: number;
  unit: string;
  currentQuantity: number;
  _count?: { movements: number };
  createdAt: string;
  updatedAt: string;
}

/** One finished-goods card per (product, type, packing) group */
export interface HarvestSummaryGroup {
  productName: string;
  /** plant code from the box label — separates two batches of one variety */
  planteCode: string;
  targetType: "TUNNEL" | "SECTOR";
  stockType: string | null;
  plantsPerBox: number;
  boxCount: number;
  totalPlants: number;
  lastHarvestedAt: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
