"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHarvestRecords,
  createHarvestRecord,
  deleteHarvestRecord,
  getHarvestedProducts,
  getHarvestSummary,
  writeOffHarvestedProduct,
} from "@/app/lib/services/harvest";
import type { MovementReason } from "@/app/lib/types/stock";

export function useHarvestRecords(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  targetType?: string;
}) {
  return useQuery({
    queryKey: ["harvest-records", params],
    queryFn: () => getHarvestRecords(params),
  });
}

export function useCreateHarvestRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHarvestRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["harvest-records"] });
      qc.invalidateQueries({ queryKey: ["harvested-products"] });
    },
  });
}

export function useDeleteHarvestRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHarvestRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["harvest-records"] });
      qc.invalidateQueries({ queryKey: ["harvested-products"] });
    },
  });
}

export function useHarvestedProducts() {
  return useQuery({
    queryKey: ["harvested-products"],
    queryFn: getHarvestedProducts,
  });
}

export function useHarvestSummary() {
  return useQuery({
    queryKey: ["harvest-records", "summary"],
    queryFn: getHarvestSummary,
  });
}

/**
 * Empty a finished-goods product with a reason. A write-off moves real stock,
 * so it refreshes both the cards (which carry the quantity) and the summary.
 */
export function useWriteOffHarvestedProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      reason: MovementReason;
      note?: string;
    }) =>
      writeOffHarvestedProduct(input.id, {
        reason: input.reason,
        note: input.note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["harvest-records"] });
      qc.invalidateQueries({ queryKey: ["harvested-products"] });
    },
  });
}
