import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTruck,
  deleteTruck,
  getTruck,
  getTrucks,
  updateTruck,
} from "@/app/lib/services/trucks";
import type { CreateTruckInput } from "@/app/lib/types/shipment";

export function useTrucks() {
  return useQuery({ queryKey: ["trucks"], queryFn: getTrucks });
}

/**
 * One truck with its shipments. The key starts with "trucks" on purpose, so the
 * existing invalidation (which invalidates that prefix) refreshes it too.
 */
export function useTruck(id: string) {
  return useQuery({
    queryKey: ["trucks", "detail", id],
    queryFn: () => getTruck(id),
    enabled: !!id,
  });
}

/** Editing trucks can move shipment counts, so both lists are refreshed. */
function useRefreshTrucks() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["trucks"] });
    queryClient.invalidateQueries({ queryKey: ["shipments"] });
  };
}

export function useCreateTruck() {
  const refresh = useRefreshTrucks();
  return useMutation({
    mutationFn: (dto: CreateTruckInput) => createTruck(dto),
    onSuccess: refresh,
  });
}

export function useUpdateTruck() {
  const refresh = useRefreshTrucks();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateTruckInput> }) =>
      updateTruck(id, dto),
    onSuccess: refresh,
  });
}

export function useDeleteTruck() {
  const refresh = useRefreshTrucks();
  return useMutation({
    mutationFn: (id: string) => deleteTruck(id),
    onSuccess: refresh,
  });
}
