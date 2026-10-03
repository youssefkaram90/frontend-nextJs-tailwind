// ============================================================
// Sowing types — aligned with backend
// ============================================================

import { ProductType, StockType } from "./delivery";

// --- Enums ---

export enum SowingType {
  SSM = "SSM",
  LPM = "LPM",
}

export enum PlanStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum PlanEntryStatus {
  PLANNED = "PLANNED",
  PARTIALLY_EXECUTED = "PARTIALLY_EXECUTED",
  EXECUTED = "EXECUTED",
  /** Manually closed below the planned quantity. Final. */
  CLOSED = "CLOSED",
}

// --- Tunnel & Sector ---

export interface Tunnel {
  id: string;
  number: string;
  location?: string | null;
  capacity: number;
  _count?: { ssmSowings: number };
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: string;
  name: string;
  location?: string | null;
  _count?: { lpmSowings: number };
  createdAt: string;
  updatedAt: string;
}

// --- PlantStock ---

export interface PlantStock {
  id: string;
  ssmSowingId?: string | null;
  lpmSowingId?: string | null;
  variety: string;
  /** batch code (SSM batches) — display as "variety <code>" */
  code?: number | null;
  location: string;
  lotNumber: string;
  stockType: string;
  numberOfTrays?: number | null;
  seedsPerTray?: number | null;
  lines?: number | null;
  metersPerLine?: number | null;
  seedsPerMeter?: number | null;
  expectedPlants: number;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface TunnelAssignment {
  id: string;
  ssmSowingId: string;
  tunnelId: string;
  tunnel?: Tunnel;
  numberOfTrays: number;
  transportDate: string;
}

// --- Sowing SSM ---

export interface SowingSSM {
  id: string;
  planId: string;
  plan?: SowingPlan;
  planEntryId?: string | null;
  variety: string;
  /** batch code (SSM) — variety stays plain; display as "variety <code>" */
  code?: number | null;
  sowingDate: string;
  lotNumber: string;
  stockType: string;
  productType: string;
  numberOfTrays: number;
  seedsPerTray: number;
  quantityUsed: number;
  tunnelId: string | undefined;
  tunnel?: Tunnel | null;
  tunnelAssignments?: TunnelAssignment[];
  remarks?: string | null;
  plantStock?: PlantStock | null;
  createdAt: string;
  updatedAt: string;
}

// --- Sowing LPM ---

export interface SowingLPM {
  id: string;
  planId: string;
  plan?: SowingPlan;
  planEntryId?: string | null;
  variety: string;
  sowingDate: string;
  lotNumber: string;
  stockType: string;
  productType: string;
  quantityUsed: number;
  sectorId?: string | undefined;
  sector?: Sector;
  lines?: number | null;
  meterPerLine: number;
  seedsPerMeter?: number | null;
  remarks?: string | null;
  plantStock?: PlantStock | null;
  createdAt: string;
  updatedAt: string;
}

// --- SowingPlan & Entries ---

export interface SowingPlan {
  id: string;
  planType: SowingType;
  name: string;
  location?: string | null;
  status: PlanStatus;
  entries?: SowingPlanEntry[];
  _count?: { entries: number };
  executedCount?: number;
  plannedTotal?: number;
  executedTotal?: number;
  progressPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SowingPlanEntry {
  id: string;
  planId: string;
  variety: string;
  stockType: string;
  peat?: string | null;
  status: PlanEntryStatus;
  plannedDate: string;
  plannedTrays?: number | null;
  plannedQuantity?: number | null;
  executedTrays?: number | null;
  executedQuantity?: number | null;
  sectorId?: string | null;
  sector?: Sector | null;
  lines?: number | null;
  metersPerLine?: number | null;
  seedsPerMeter?: number | null;
  ssmSowings?: SowingSSM[];
  lpmSowings?: SowingLPM[];
  createdAt: string;
  updatedAt: string;
}

// --- DTOs ---

export interface CreateSowingPlanDto {
  planType: SowingType;
  name: string;
}

export interface CreatePlanEntryDto {
  variety: string;
  stockType: StockType;
  peat?: string;
  plannedDate: Date;
  // SSM
  plannedTrays?: number;
  // LPM
  plannedQuantity?: number;
  sectorId?: string;
  lines?: number;
  metersPerLine?: number;
  seedsPerMeter?: number;
  remark?: string;
}

export interface ExecuteSSMDto {
  planId: string;
  planEntryId?: string;
  tunnelId?: string;
  variety: string;
  code?: number;
  lotNumber: string;
  stockType?: string;
  numberOfTrays: number;
  seedsPerTray?: number;
  sowingDate: Date;
  remarks?: string;
}

export interface ExecuteLPMDto {
  planId: string;
  planEntryId?: string;
  sectorId?: string;
  variety: string;
  lotNumber: string;
  stockType?: string;
  quantityUsed: number;
  sowingDate: Date;
  lines?: number;
  meterPerLine?: number;
  seedsPerMeter?: number;
  remarks?: string;
}

/**
 * The PATCH payloads. Every field is optional (SSM-03): the server keeps what a
 * request leaves out, which is exactly why the edit forms must send an explicit
 * `null` to clear a tunnel or a sector — an omitted field means "keep".
 *
 * The two ids are re-declared outside the `Omit` because `ExecuteSSMDto` says
 * `string | undefined` and `string | null | undefined` is not assignable to it —
 * the same shape as `UpdateSSMDto` / `UpdateLPMDto` on the server.
 */
export type UpdateSowingSSMDto = Partial<Omit<ExecuteSSMDto, "tunnelId">> & {
  tunnelId?: string | null;
};

export type UpdateSowingLPMDto = Partial<Omit<ExecuteLPMDto, "sectorId">> & {
  sectorId?: string | null;
};

// --- Pending entries (executor dashboard) ---

export interface PendingPlanGroup {
  planId: string;
  planName: string;
  planType: string;
  entries: SowingPlanEntry[];
}

// --- Pending transport (transporter dashboard) ---

export interface PendingTransportSowing {
  id: string;
  planId: string;
  planName: string;
  variety: string;
  code: number | null;
  lotNumber: string;
  stockType: string;
  numberOfTrays: number;
  assignedTrays: number;
  remainingTrays: number;
  tunnelNumber: string | null;
  sowingDate: string;
  assignments: {
    id: string;
    tunnelId: string;
    tunnelNumber: string;
    numberOfTrays: number;
    transportDate: string;
  }[];
}

export interface PendingTransportGroup {
  planId: string;
  planName: string;
  sowings: PendingTransportSowing[];
}
