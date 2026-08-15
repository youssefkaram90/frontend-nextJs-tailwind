import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTunnels,
  getSectors,
  getSowingSSMs,
  getSowingLPMs,
  getSowingSSM,
  getSowingLPM,
  getSowingPlans,
  executeSSM,
  executeLPM,
  updateSowingSSM,
  updateSowingLPM,
  deleteSowingSSM,
  deleteSowingLPM,
} from "@/app/lib/services/sowing";
import { getStockItems } from "@/app/lib/services/stock";

// ---- Lookup data ----
export function useTunnels() {
  return useQuery({
    queryKey: ["tunnels"],
    queryFn: () => getTunnels(),
    staleTime: 5 * 60_000, // tunnels rarely change
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: () => getSectors(),
    staleTime: 5 * 60_000,
  });
}

export function useStockItemsForSowing() {
  return useQuery({
    queryKey: ["stock", "items"],
    queryFn: () => getStockItems(),
    staleTime: 2 * 60_000,
  });
}

export function useSowingPlans() {
  return useQuery({
    queryKey: ["sowing-plans"],
    queryFn: () => getSowingPlans(),
    staleTime: 2 * 60_000,
  });
}

// ---- Sowing lists ----
export function useSowingSSMs(q?: string) {
  return useQuery({
    queryKey: ["sowing", "ssm", q ?? ""],
    queryFn: () => getSowingSSMs(q || undefined),
  });
}

export function useSowingLPMs(q?: string) {
  return useQuery({
    queryKey: ["sowing", "lpm", q ?? ""],
    queryFn: () => getSowingLPMs(q || undefined),
  });
}

// ---- Single sowing detail ----
export function useSowingSSM(id: string) {
  return useQuery({
    queryKey: ["sowing", "ssm", id],
    queryFn: () => getSowingSSM(id),
    enabled: !!id,
  });
}

export function useSowingLPM(id: string) {
  return useQuery({
    queryKey: ["sowing", "lpm", id],
    queryFn: () => getSowingLPM(id),
    enabled: !!id,
  });
}

// ---- Mutations ----
export function useExecuteSSM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: executeSSM,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useExecuteLPM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: executeLPM,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useUpdateSowingSSM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Parameters<typeof updateSowingSSM>[1]) =>
      updateSowingSSM(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing"] });
    },
  });
}

export function useUpdateSowingLPM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Parameters<typeof updateSowingLPM>[1]) =>
      updateSowingLPM(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing"] });
    },
  });
}

export function useDeleteSowingSSM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSowingSSM,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing"] });
    },
  });
}

export function useDeleteSowingLPM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSowingLPM,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing"] });
    },
  });
}
