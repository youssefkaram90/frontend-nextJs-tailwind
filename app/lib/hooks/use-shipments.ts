import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createShipment,
  deleteShipment,
  getShipment,
  getShipments,
  updateShipment,
} from "@/app/lib/services/shipments";
import type { CreateShipmentInput } from "@/app/lib/types/shipment";

export function useShipments(params: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["shipments", params.q ?? "", params.page ?? 1],
    queryFn: () => getShipments(params),
  });
}

/**
 * Shipping moves finished-goods stock AND changes what a truck carries, so the
 * harvest figures and the truck screens have to be refreshed too — otherwise the
 * stock figure and the per-truck shipment counts stay stale on screen.
 */
function useRefreshStock() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["shipments"] });
    queryClient.invalidateQueries({ queryKey: ["harvested-products"] });
    queryClient.invalidateQueries({ queryKey: ["harvest-records"] });
    // Covers both the fleet list (_count.shipments) and the truck detail page.
    queryClient.invalidateQueries({ queryKey: ["trucks"] });
  };
}

/** One shipment, for the edit screen. Key starts with "shipments" on purpose
 * so the existing list invalidation refreshes it too. */
export function useShipment(id: string) {
  return useQuery({
    queryKey: ["shipments", "detail", id],
    queryFn: () => getShipment(id),
    enabled: !!id,
  });
}

export function useCreateShipment() {
  const refresh = useRefreshStock();
  return useMutation({
    mutationFn: (dto: CreateShipmentInput) => createShipment(dto),
    onSuccess: refresh,
  });
}

export function useDeleteShipment() {
  const refresh = useRefreshStock();
  return useMutation({
    mutationFn: (id: string) => deleteShipment(id),
    onSuccess: refresh,
  });
}

export function useUpdateShipment() {
  const refresh = useRefreshStock();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateShipmentInput }) =>
      updateShipment(id, dto),
    onSuccess: refresh,
  });
}
