import { api } from "../api";
import type {
  PhytosanitaryProduct,
  PhytosanitaryProgram,
  CropOperation,
  CropCarePlan,
  ComplianceData,
  LocationTarget,
  Paginated,
} from "../types/crop-care";

// -------------------------------------------------------------------
// Phytosanitary products
// -------------------------------------------------------------------

export async function getProducts(q?: string): Promise<PhytosanitaryProduct[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<PhytosanitaryProduct[]>(`/api/phytosanitary-products${params}`);
}

export async function createProduct(dto: Partial<PhytosanitaryProduct>) {
  return api<PhytosanitaryProduct>("/api/phytosanitary-products", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateProduct(
  id: string,
  dto: Partial<PhytosanitaryProduct>,
) {
  return api<PhytosanitaryProduct>(`/api/phytosanitary-products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function deleteProduct(id: string) {
  return api<{ id: string }>(`/api/phytosanitary-products/${id}`, {
    method: "DELETE",
  });
}

// -------------------------------------------------------------------
// Phytosanitary program + compliance
// -------------------------------------------------------------------

export async function getProgram(): Promise<PhytosanitaryProgram | null> {
  return api<PhytosanitaryProgram | null>("/api/phytosanitary-program");
}

export async function createProgram(dto: { name: string; notes?: string }) {
  return api<PhytosanitaryProgram>("/api/phytosanitary-program", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateProgram(
  id: string,
  dto: {
    name?: string;
    notes?: string;
    active?: boolean;
    productIds?: string[];
  },
) {
  return api<PhytosanitaryProgram>(`/api/phytosanitary-program/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function getCompliance(): Promise<ComplianceData> {
  return api<ComplianceData>("/api/phytosanitary-compliance");
}

// -------------------------------------------------------------------
// Crop operations (standalone log)
// -------------------------------------------------------------------

export async function getOperations(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  operationType?: string;
  targetType?: string;
  targetId?: string;
}): Promise<Paginated<CropOperation>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.operationType) search.set("operationType", params.operationType);
  if (params.targetType) search.set("targetType", params.targetType);
  if (params.targetId) search.set("targetId", params.targetId);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return api<Paginated<CropOperation>>(
    `/api/crop-operations?${search.toString()}`,
  );
}

/**
 * The body of a logged operation.
 *
 * One type for both jobs (CROP-14): logging one and correcting one send the same
 * thing, because a correction is the whole operation written again rather than a
 * patch of some of its fields.
 */
export type CropOperationInput = {
  operationType: "IRRIGATION" | "TREATMENT" | "FERTILISATION";
  productId?: string;
  quantity?: number;
  performedAt: string;
  notes?: string;
  locations: LocationTarget[];
};

export async function createOperation(dto: CropOperationInput) {
  return api<CropOperation>("/api/crop-operations", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/** Correct a logged operation (CROP-14). */
export async function updateOperation(id: string, dto: CropOperationInput) {
  return api<CropOperation>(`/api/crop-operations/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function deleteOperation(id: string) {
  return api<{ id: string }>(`/api/crop-operations/${id}`, {
    method: "DELETE",
  });
}

// -------------------------------------------------------------------
// Crop care plans
// -------------------------------------------------------------------

export async function getPlans(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<CropCarePlan>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return api<Paginated<CropCarePlan>>(
    `/api/crop-care-plans?${search.toString()}`,
  );
}

export async function getPlan(id: string): Promise<CropCarePlan> {
  return api<CropCarePlan>(`/api/crop-care-plans/${id}`);
}

export async function getPendingEntries() {
  return api<unknown[]>("/api/crop-care-plans/pending-entries");
}

export async function createPlan(dto: {
  planType: "IRRIGATION" | "TREATMENT" | "FERTILISATION";
  name: string;
  locations?: LocationTarget[];
  entries: {
    plannedDate: string;
    productId?: string;
    quantity?: number;
    notes?: string;
  }[];
}) {
  return api<CropCarePlan>("/api/crop-care-plans", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updatePlanStatus(id: string, status: string) {
  return api<CropCarePlan>(`/api/crop-care-plans/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deletePlan(id: string) {
  return api<{ id: string }>(`/api/crop-care-plans/${id}`, {
    method: "DELETE",
  });
}

export async function addPlanEntry(
  planId: string,
  dto: {
    plannedDate: string;
    productId?: string;
    quantity?: number;
    notes?: string;
  },
) {
  return api(`/api/crop-care-plans/${planId}/entries`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function deletePlanEntry(entryId: string) {
  return api(`/api/crop-care-plans/entries/${entryId}`, {
    method: "DELETE",
  });
}

export async function executePlanEntry(
  entryId: string,
  dto: {
    performedAt: string;
    locations?: LocationTarget[];
    quantity?: number;
    notes?: string;
  },
) {
  return api<CropOperation>(`/api/crop-care-plans/entries/${entryId}/execute`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
