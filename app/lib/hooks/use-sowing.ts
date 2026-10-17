import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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

/**
 * The tunnels of the open season. `q` is optional and forwarded as `?q=` — the
 * capability exists on both clients so a search can be added without touching the
 * hook again (TNL-6).
 */
export function useTunnels(q?: string) {
  return useQuery({
    queryKey: ["tunnels", { q }],
    queryFn: () => getTunnels(q),
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
    placeholderData: keepPreviousData,
  });
}

// ---- Sowing lists ----
export function useSowingSSMs(q?: string) {
  return useQuery({
    queryKey: ["sowing", "ssm", q ?? ""],
    queryFn: () => getSowingSSMs(q || undefined),
    placeholderData: keepPreviousData,
  });
}

export function useSowingLPMs(q?: string) {
  return useQuery({
    queryKey: ["sowing", "lpm", q ?? ""],
    queryFn: () => getSowingLPMs(q || undefined),
    placeholderData: keepPreviousData,
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
      // An edit gives the old deduction back and takes the new one, so the stock
      // figures are stale too, not just the sowing (SOW-19).
      qc.invalidateQueries({ queryKey: ["stock"] });
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
      // Same as the SSM edit: the seed deduction is reversed and re-applied
      // (SOW-19).
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useDeleteSowingSSM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSowingSSM,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing"] });
      // Deleting gives the seeds and the peat back (SOW-19).
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useDeleteSowingLPM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSowingLPM,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sowing"] });
      // Deleting gives the seeds back (SOW-19).
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}
