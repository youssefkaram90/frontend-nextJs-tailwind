// ============================================================
// Plant stock types — aligned with backend GET /plant-stock
// ============================================================

export interface PlantCount {
  id: string;
  plantStockId: string;
  countType: string; // 'TRAY' | 'METER'
  sampleSize: number;
  countedPlants: number;
  density: number;
  estimatedPlants: number;
  germinationRate: number | null;
  countDate: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Row shape returned by `GET /plant-stock`.
 * SSM batches are split per tunnel assignment (each tunnel gets its own row
 * with proportional trays/seeds/expected plants + `inTunnel`). LPM stays one
 * row per sowing with `location` = sector name.
 */
export interface PlantStockRow {
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
  seedsSown: number;
  currentStage: string;
  /** trays actually in the tunnel (SSM only); null when nothing transported */
  inTunnel: number | null;
  counts?: PlantCount[];
  createdAt: string;
  updatedAt: string;
}
