import { api } from "../api";
import type {
  HarvestRecord,
  HarvestedProduct,
  HarvestSummaryGroup,
  Paginated,
} from "../types/harvest";
import type { MovementReason } from "../types/stock";

export async function getHarvestRecords(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  targetType?: string;
  targetId?: string;
}): Promise<Paginated<HarvestRecord>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.targetType) search.set("targetType", params.targetType);
  if (params.targetId) search.set("targetId", params.targetId);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return api<Paginated<HarvestRecord>>(
    `/api/harvest-records?${search.toString()}`,
  );
}

export async function createHarvestRecord(dto: {
  productName: string;
  targetType: "TUNNEL" | "SECTOR";
  /**
   * IGNORED — the server derives the plant code from the batch (SSM: its batch
   * code; LPM: box size in hundreds + sector). Optional so callers that still
   * send a preview do not fail to compile.
   */
  planteCode?: string;
  tunnelId?: string;
  sectorId?: string;
  stockType?: string;
  boxCount: number;
  plantsPerBox: number;
  harvestedAt: string;
  /** Required — a harvest must be tied to the batch it came from. */
  plantStockId: string;
}): Promise<HarvestRecord> {
  return api<HarvestRecord>("/api/harvest-records", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function deleteHarvestRecord(id: string) {
  return api<{ id: string }>(`/api/harvest-records/${id}`, {
    method: "DELETE",
  });
}

export async function getHarvestedProducts(): Promise<HarvestedProduct[]> {
  return api<HarvestedProduct[]>("/api/harvested-products");
}

export async function getHarvestSummary(): Promise<HarvestSummaryGroup[]> {
  return api<HarvestSummaryGroup[]>("/api/harvest-records/summary");
}

/**
 * Write off everything left of a finished-goods product:
 * the boxes that spoiled, went in the bin, or were counted wrong.
 *
 * There is deliberately no amount — the whole remaining quantity goes at once,
 * because a half write-off would leave a figure nobody can justify. The reason
 * is required: it is the only record of where the boxes went.
 */
export async function writeOffHarvestedProduct(
  id: string,
  dto: { reason: MovementReason; note?: string },
): Promise<{ id: string; writtenOff: number; remaining: number }> {
  return api<{ id: string; writtenOff: number; remaining: number }>(
    `/api/harvested-products/${id}/writeoff`,
    { method: "POST", body: JSON.stringify(dto) },
  );
}
