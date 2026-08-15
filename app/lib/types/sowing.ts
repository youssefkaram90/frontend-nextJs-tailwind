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
  location: string;
  lotNumber: string;
  stockType: string;
  numberOfTrays?: number | null;
  seedsPerTray?: number | null;
  lines?: string | null;
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
  sowingDate: string;
  lotNumber: string;
  stockType: string;
  productType: string;
  numberOfTrays: number;
  seedsPerTray: number;
  quantityUsed: number;
  tunnelId: string | null;
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
  sectorId?: string | null;
  sector?: Sector;
  lines?: string | null;
  metersPerLine?: number | null;
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
  lines?: string | null;
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
  lines?: string;
  metersPerLine?: number;
  seedsPerMeter?: number;
}

export interface ExecuteSSMDto {
  planId: string;
  planEntryId?: string;
  tunnelId?: string;
  variety: string;
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
  lines?: string;
  metersPerLine?: number;
  seedsPerMeter?: number;
  remarks?: string;
}

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
