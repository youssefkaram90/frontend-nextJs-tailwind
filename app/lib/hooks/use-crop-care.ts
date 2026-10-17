"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProgram,
  createProgram,
  updateProgram,
  getCompliance,
  getOperations,
  createOperation,
  updateOperation,
  deleteOperation,
  getPlans,
  getPlan,
  getPendingEntries,
  createPlan,
  updatePlanStatus,
  deletePlan,
  addPlanEntry,
  deletePlanEntry,
  executePlanEntry,
} from "@/app/lib/services/crop-care";
import type { CropOperationInput } from "@/app/lib/services/crop-care";

// -------------------------------------------------------------------
// Products
// -------------------------------------------------------------------

export function useProducts(q?: string) {
  return useQuery({
    queryKey: ["phytosanitary-products", q ?? ""],
    queryFn: () => getProducts(q),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["phytosanitary-products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<Parameters<typeof updateProduct>[1]>;
    }) => updateProduct(id, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["phytosanitary-products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["phytosanitary-products"] });
      qc.invalidateQueries({ queryKey: ["phytosanitary-program"] });
      qc.invalidateQueries({ queryKey: ["phytosanitary-compliance"] });
    },
  });
}

// -------------------------------------------------------------------
// Program + compliance
// -------------------------------------------------------------------

export function useProgram() {
  return useQuery({
    queryKey: ["phytosanitary-program"],
    queryFn: getProgram,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProgram,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["phytosanitary-program"] });
      qc.invalidateQueries({ queryKey: ["phytosanitary-compliance"] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Parameters<typeof updateProgram>[1];
    }) => updateProgram(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["phytosanitary-program"] });
      qc.invalidateQueries({ queryKey: ["phytosanitary-compliance"] });
    },
  });
}

export function useCompliance() {
  return useQuery({
    queryKey: ["phytosanitary-compliance"],
    queryFn: getCompliance,
  });
}

// -------------------------------------------------------------------
// Operations
// -------------------------------------------------------------------

export function useOperations(params: {
  q?: string;
  operationType?: string;
  /**
   * One location only — a tunnel or a sector.
   *
   * Kept because the backend (`findAllOperations`) and the service both accept
   * it, and it is the precise form of "what was done in T3?" — a link such as
   * `/crop-care?tunnel=<id>` would need nothing new. The operations list uses the
   * SEARCH box instead (CROP-11, user 2026-10-11): typing `T1` goes through `q`,
   * which now matches tunnel and sector names as well as notes and products.
   */
  targetType?: string;
  targetId?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["crop-operations", params],
    queryFn: () => getOperations(params),
  });
}

export function useCreateOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOperation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-operations"] });
      qc.invalidateQueries({ queryKey: ["phytosanitary-compliance"] });
      qc.invalidateQueries({ queryKey: ["crop-care-plans"] });
      // Logging a treatment takes its product out of the season's stock, so the
      // balances are stale the moment this succeeds (CROP-16).
      qc.invalidateQueries({ queryKey: ["agri-inputs"] });
    },
  });
}

/**
 * Correct a logged operation (CROP-14).
 *
 * The season's balances and the product's movement list are invalidated as well,
 * because a correction can move stock: a changed dose gives the old amount back
 * and takes the new one out.
 */
export function useUpdateOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CropOperationInput }) =>
      updateOperation(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-operations"] });
      qc.invalidateQueries({ queryKey: ["phytosanitary-compliance"] });
      qc.invalidateQueries({ queryKey: ["agri-inputs"] });
    },
  });
}

export function useDeleteOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOperation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-operations"] });
      qc.invalidateQueries({ queryKey: ["phytosanitary-compliance"] });
      // Deleting gives back what the operation had used, so the season's balances
      // and the product's movement list are stale too — they were not, and the
      // stock screen kept showing the deducted number until something else
      // happened to refetch it (CROP-16, found while writing CROP-14).
      qc.invalidateQueries({ queryKey: ["agri-inputs"] });
    },
  });
}

// -------------------------------------------------------------------
// Plans
// -------------------------------------------------------------------

export function usePlans(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["crop-care-plans", params],
    queryFn: () => getPlans(params),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: ["crop-care-plans", id],
    queryFn: () => getPlan(id),
    enabled: !!id,
  });
}

export function usePendingEntries() {
  return useQuery({
    queryKey: ["crop-care-plans", "pending-entries"],
    queryFn: getPendingEntries,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-care-plans"] });
      qc.invalidateQueries({
        queryKey: ["crop-care-plans", "pending-entries"],
      });
    },
  });
}

export function useUpdatePlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePlanStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-care-plans"] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-care-plans"] });
      qc.invalidateQueries({
        queryKey: ["crop-care-plans", "pending-entries"],
      });
    },
  });
}

export function useAddPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      dto,
    }: {
      planId: string;
      dto: Parameters<typeof addPlanEntry>[1];
    }) => addPlanEntry(planId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-care-plans"] }),
  });
}

export function useDeletePlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlanEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop-care-plans"] }),
  });
}

export function useExecutePlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      dto,
    }: {
      entryId: string;
      dto: Parameters<typeof executePlanEntry>[1];
    }) => executePlanEntry(entryId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop-care-plans"] });
      qc.invalidateQueries({
        queryKey: ["crop-care-plans", "pending-entries"],
      });
      qc.invalidateQueries({ queryKey: ["crop-operations"] });
      qc.invalidateQueries({ queryKey: ["phytosanitary-compliance"] });
      // Executing an entry takes its product out of the season's stock too, so the
      // balances are stale the moment this succeeds (CROP-16).
      qc.invalidateQueries({ queryKey: ["agri-inputs"] });
    },
  });
}
