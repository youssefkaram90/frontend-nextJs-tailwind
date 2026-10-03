import { api } from "../api";
import type { CreateTruckInput, Truck, TruckDetail } from "../types/shipment";

export async function getTrucks(): Promise<Truck[]> {
  return api<Truck[]>("/api/trucks");
}

/** One truck with its shipments — the truck detail screen. */
export async function getTruck(id: string): Promise<TruckDetail> {
  return api<TruckDetail>(`/api/trucks/${id}`);
}

export async function createTruck(dto: CreateTruckInput): Promise<Truck> {
  return api<Truck>("/api/trucks", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/**
 * Mainly to fill in the plates on trucks backfilled from the old free-text
 * field, which start with an empty trailer plate.
 */
export async function updateTruck(
  id: string,
  dto: Partial<CreateTruckInput>,
): Promise<Truck> {
  return api<Truck>(`/api/trucks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function deleteTruck(id: string) {
  return api<{ id: string }>(`/api/trucks/${id}`, { method: "DELETE" });
}
