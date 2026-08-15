import { api } from "../api";
import type {
  SowingSSM,
  SowingLPM,
  SowingPlan,
  SowingPlanEntry,
  ExecuteSSMDto,
  ExecuteLPMDto,
  CreateSowingPlanDto,
  CreatePlanEntryDto,
  Tunnel,
  Sector,
  PendingPlanGroup,
  PendingTransportGroup,
} from "../types/sowing";

// ============================================================
// Tunnels
// ============================================================

export async function getTunnels(q?: string): Promise<Tunnel[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<Tunnel[]>(`/api/tunnels${params}`);
}

export async function getTunnel(id: string): Promise<Tunnel> {
  return api<Tunnel>(`/api/tunnels/${id}`);
}

export async function createTunnel(dto: {
  number: string;
  location?: string;
  capacity: number;
}): Promise<Tunnel> {
  return api<Tunnel>("/api/tunnels", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateTunnel(
  id: string,
  dto: { number: string; location?: string; capacity: number },
): Promise<Tunnel> {
  return api<Tunnel>(`/api/tunnels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function deleteTunnel(id: string): Promise<void> {
  await api<void>(`/api/tunnels/${id}`, { method: "DELETE" });
}

// ============================================================
// Sectors
// ============================================================

export async function getSectors(q?: string): Promise<Sector[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<Sector[]>(`/api/sectors${params}`);
}

export async function getSector(id: string): Promise<Sector> {
  return api<Sector>(`/api/sectors/${id}`);
}

export async function createSector(dto: {
  name: string;
  location?: string;
}): Promise<Sector> {
  return api<Sector>("/api/sectors", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateSector(
  id: string,
  dto: { name: string; location?: string },
): Promise<Sector> {
  return api<Sector>(`/api/sectors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function deleteSector(id: string): Promise<void> {
  await api<void>(`/api/sectors/${id}`, { method: "DELETE" });
}

// ============================================================
// Sowing Plans
// ============================================================

export async function getSowingPlans(q?: string): Promise<SowingPlan[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<SowingPlan[]>(`/api/sowing-plans${params}`);
}

export async function getSowingPlan(id: string): Promise<SowingPlan> {
  return api<SowingPlan>(`/api/sowing-plans/${id}`);
}

export async function createSowingPlan(
  dto: CreateSowingPlanDto,
): Promise<SowingPlan> {
  return api<SowingPlan>("/api/sowing-plans", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function createPlanWithEntries(dto: {
  planType: string;
  name: string;
  location?: string;
  sectorId: string;
  entries: CreatePlanEntryDto[];
}): Promise<SowingPlan> {
  return api<SowingPlan>("/api/sowing-plans/with-entries", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function deleteSowingPlan(id: string): Promise<void> {
  await api<void>(`/api/sowing-plans/${id}`, { method: "DELETE" });
}

export async function updatePlanStatus(
  id: string,
  status: string,
): Promise<SowingPlan> {
  return api<SowingPlan>(`/api/sowing-plans/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function importPlanFromExcel(dto: {
  planType: string;
  name: string;
  excelBase64: string;
}): Promise<SowingPlan> {
  return api<SowingPlan>("/api/sowing-plans/import", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function getPlanEntries(
  planId: string,
): Promise<SowingPlanEntry[]> {
  return api<SowingPlanEntry[]>(`/api/sowing-plans/${planId}/entries`);
}

export async function addPlanEntry(
  planId: string,
  dto: CreatePlanEntryDto,
): Promise<SowingPlanEntry> {
  return api<SowingPlanEntry>(`/api/sowing-plans/${planId}/entries`, {
    method: "POST",
    body: JSON.stringify({
      ...dto,
      plannedDate:
        dto.plannedDate instanceof Date
          ? dto.plannedDate.toLocaleDateString("en-CA")
          : dto.plannedDate,
    }),
  });
}

export async function addBulkPlanEntries(
  planId: string,
  dtos: CreatePlanEntryDto[],
): Promise<void> {
  await api<void>(`/api/sowing-plans/${planId}/entries/bulk`, {
    method: "POST",
    body: JSON.stringify(
      dtos.map((d) => ({
        ...d,
        plannedDate:
          d.plannedDate instanceof Date
            ? d.plannedDate.toLocaleDateString("en-CA")
            : d.plannedDate,
      })),
    ),
  });
}

export async function deletePlanEntry(entryId: string): Promise<void> {
  await api<void>(`/api/sowing-plans/entries/${entryId}`, { method: "DELETE" });
}

// --- Pending entries (executor dashboard) ---

export async function getPendingPlanEntries(): Promise<PendingPlanGroup[]> {
  return api<PendingPlanGroup[]>("/api/sowing-plans/pending-entries");
}

// ============================================================
// Sowing SSM
// ============================================================

export async function getSowingSSMs(q?: string): Promise<SowingSSM[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<SowingSSM[]>(`/api/sowing-ssm${params}`);
}

export async function getSowingSSM(id: string): Promise<SowingSSM> {
  return api<SowingSSM>(`/api/sowing-ssm/${id}`);
}

export async function executeSSM(dto: ExecuteSSMDto): Promise<SowingSSM> {
  return api<SowingSSM>("/api/sowing-ssm/execute", {
    method: "POST",
    body: JSON.stringify({
      ...dto,
      sowingDate:
        dto.sowingDate instanceof Date
          ? dto.sowingDate.toLocaleDateString("en-CA")
          : dto.sowingDate,
    }),
  });
}

export async function updateSowingSSM(
  id: string,
  dto: ExecuteSSMDto,
): Promise<SowingSSM> {
  return api<SowingSSM>(`/api/sowing-ssm/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...dto,
      sowingDate:
        dto.sowingDate instanceof Date
          ? dto.sowingDate.toLocaleDateString("en-CA")
          : dto.sowingDate,
    }),
  });
}

export async function deleteSowingSSM(id: string): Promise<void> {
  await api<void>(`/api/sowing-ssm/${id}`, { method: "DELETE" });
}

// ============================================================
// Sowing LPM
// ============================================================

export async function getSowingLPMs(q?: string): Promise<SowingLPM[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return api<SowingLPM[]>(`/api/sowing-lpm${params}`);
}

export async function getSowingLPM(id: string): Promise<SowingLPM> {
  return api<SowingLPM>(`/api/sowing-lpm/${id}`);
}

export async function executeLPM(dto: ExecuteLPMDto): Promise<SowingLPM> {
  return api<SowingLPM>("/api/sowing-lpm/execute", {
    method: "POST",
    body: JSON.stringify({
      ...dto,
      sowingDate:
        dto.sowingDate instanceof Date
          ? dto.sowingDate.toLocaleDateString("en-CA")
          : dto.sowingDate,
    }),
  });
}

export async function updateSowingLPM(
  id: string,
  dto: ExecuteLPMDto,
): Promise<SowingLPM> {
  return api<SowingLPM>(`/api/sowing-lpm/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...dto,
      sowingDate:
        dto.sowingDate instanceof Date
          ? dto.sowingDate.toLocaleDateString("en-CA")
          : dto.sowingDate,
    }),
  });
}

export async function deleteSowingLPM(id: string): Promise<void> {
  await api<void>(`/api/sowing-lpm/${id}`, { method: "DELETE" });
}

// ============================================================
// Tray Transport (trays → tunnels)
// ============================================================

export async function getPendingTransport(): Promise<PendingTransportGroup[]> {
  return api<PendingTransportGroup[]>("/api/tray-transport/pending");
}

export interface TunnelAssignment {
  id: string;
  ssmSowingId: string;
  tunnelId: string;
  numberOfTrays: number;
  transportDate: string;
  tunnel?: { id: string; number: string; capacity: number };
  ssmSowing?: {
    variety: string;
    numberOfTrays: number;
    lotNumber: string;
    plan?: { name: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface TunnelWithAssignments {
  tunnel: { id: string; number: string; capacity: number };
  assignments: TunnelAssignment[];
  totalAssigned: number;
}

export async function createTunnelAssignments(dto: {
  assignments: {
    ssmSowingId: string;
    tunnelId: string;
    numberOfTrays: number;
  }[];
  transportDate?: string;
}): Promise<TunnelAssignment[]> {
  return api<TunnelAssignment[]>("/api/tray-transport", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function getTunnelAssignments(): Promise<TunnelAssignment[]> {
  return api<TunnelAssignment[]>("/api/tray-transport");
}

export async function getTunnelAssignmentsBySowing(
  ssmSowingId: string,
): Promise<TunnelAssignment[]> {
  return api<TunnelAssignment[]>(`/api/tray-transport/sowing/${ssmSowingId}`);
}

export async function getTunnelAssignmentsByTunnel(
  tunnelId: string,
): Promise<TunnelWithAssignments> {
  return api<TunnelWithAssignments>(`/api/tray-transport/tunnel/${tunnelId}`);
}

export async function updateTunnelAssignment(
  id: string,
  numberOfTrays: number,
): Promise<TunnelAssignment> {
  return api<TunnelAssignment>(`/api/tray-transport/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ numberOfTrays }),
  });
}

export async function deleteTunnelAssignment(id: string): Promise<void> {
  await api<void>(`/api/tray-transport/${id}`, {
    method: "DELETE",
  });
}
