import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSowingPlans,
  getSowingPlan,
  getPlanEntries,
  createSowingPlan,
  addPlanEntry,
  addBulkPlanEntries,
  updatePlanStatus,
  deletePlanEntry,
  deleteSowingPlan,
} from "@/app/lib/services/sowing";

export function useSowingPlans(q?: string) {
  return useQuery({
    queryKey: ["sowing-plans", q ?? ""],
    queryFn: () => getSowingPlans(q || undefined),
  });
}

export function useSowingPlan(id: string) {
  return useQuery({
    queryKey: ["sowing-plans", id],
    queryFn: () => getSowingPlan(id),
    enabled: !!id,
  });
}

export function usePlanEntries(planId: string) {
  return useQuery({
    queryKey: ["sowing-plans", planId, "entries"],
    queryFn: () => getPlanEntries(planId),
    enabled: !!planId,
  });
}

export function useCreateSowingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSowingPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing-plans"] });
    },
  });
}

export function useAddPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      ...dto
    }: { planId: string } & Parameters<typeof addPlanEntry>[1]) =>
      addPlanEntry(planId, dto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["sowing-plans", vars.planId] });
    },
  });
}

export function useAddBulkPlanEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      dtos,
    }: {
      planId: string;
      dtos: Parameters<typeof addBulkPlanEntries>[1];
    }) => addBulkPlanEntries(planId, dtos),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["sowing-plans", vars.planId] });
    },
  });
}

export function useUpdatePlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePlanStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing-plans"] });
    },
  });
}

export function useDeletePlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlanEntry,
    onSuccess: (_data, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: ["sowing-plans"] });
    },
  });
}

export function useDeleteSowingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSowingPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing-plans"] });
    },
  });
}
