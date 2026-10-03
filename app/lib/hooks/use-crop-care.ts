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
    },
  });
}
