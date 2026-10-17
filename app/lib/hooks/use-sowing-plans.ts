import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSowingPlans,
  getSowingPlan,
  getPlanEntries,
  createSowingPlan,
  addPlanEntry,
  updatePlanStatus,
  deletePlanEntry,
  updatePlanEntry,
  closePlanEntry,
  reopenPlanEntry,
  deleteSowingPlan,
} from "@/app/lib/services/sowing";
import type { CreatePlanEntryDto } from "@/app/lib/types/sowing";

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

/**
 * Add one line to a plan that already exists (SOW-08).
 *
 * The service, the relay and the backend route all existed; nothing called the
 * hook, so a plan's lines were fixed the moment the plan was created.
 */
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

/**
 * Correct an existing line (SOW-08).
 *
 * `planId` is carried only so the open plan can be refreshed — the request
 * itself addresses the entry by its own id.
 */
export function useUpdatePlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      dto,
    }: {
      planId: string;
      entryId: string;
      dto: CreatePlanEntryDto;
    }) => updatePlanEntry(entryId, dto),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing-plans"] });
    },
  });
}

export function useClosePlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: closePlanEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing-plans"] });
    },
  });
}

/** Undo a manual close (SPLAN-12). */
export function useReopenPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reopenPlanEntry,
    onSuccess: () => {
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
