// ============================================================
// Plant stock types — aligned with backend GET /plant-stock
// ============================================================

/**
 * 'TRAY'       = SSM — whole trays, sampled per variety per tunnel.
 * 'ROW_METRE'  = LPM — 1-metre samples taken one row at a time, per line.
 */
export type PlantCountType = "TRAY" | "ROW_METRE";

/**
 * ONE reading: what the operator found in a single sample — one tray (SSM), or one
 * metre of one row (LPM).
 *
 * The count's figures are calculated from these (PSTOCK-24), so a mistyped number
 * is one reading to correct rather than a total to reverse-engineer.
 */
export interface PlantCountSample {
  id: string;
  plantCountId: string;
  /** LPM only — the line it came from. Null for trays, which belong to no line. */
  line: number | null;
  /** plants found in this reading (follows from the gaps the operator counted) */
  countedPlants: number;
  /** gaps as entered for this reading; null when plants were counted directly */
  missingPlants: number | null;
  /** the order the readings were typed in */
  position: number;
  createdAt: string;
}

export interface PlantCount {
  id: string;
  plantStockId: string;
  countType: PlantCountType;
  /** tunnel number (SSM) or sector name (LPM) the sample came from */
  location: string | null;
  /** LPM only — the line, when every reading shares one. Null for a session that
   *  walked several lines, and for trays. */
  line: number | null;
  /** LPM only — how many of the 7 rows were covered. Only counts recorded before
   *  PSTOCK-24 carry this; a reading says which LINE it came from instead. */
  rowsInspected: number | null;
  /** how many readings were taken = `samples.length` */
  sampleSize: number;
  /** plants in all of them together (derived from `missingPlants` when gaps were counted) */
  countedPlants: number;
  /** gaps as entered by the operator; null when plants were counted directly */
  missingPlants: number | null;
  density: number;
  estimatedPlants: number;
  germinationRate: number | null;
  /** the readings themselves, oldest first */
  samples?: PlantCountSample[];
  countDate: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Averages of the counts taken on one sowing (SSM: one tunnel, LPM: the whole
 * sowing). `best` / `worst` expose how much the lines differ.
 */
export interface CountSummary {
  /** how many counts went into these figures */
  countCount: number;
  /** average germination %, null when nothing has been counted yet */
  germination: number | null;
  best: number | null;
  worst: number | null;
  /**
   * LPM only — one entry per line that has been counted.
   *
   * `isBest` comes from the server (PSTOCK-19): which line holds the best figure
   * is decided once, where the figures are worked out. This screen used to find
   * it again with a `reduce`, beside a `best` that had been sent to it.
   */
  lines: {
    line: number;
    countCount: number;
    germination: number;
    isBest: boolean;
  }[];
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
  /**
   * SSM batch code — mirrors `SowingSSM.code`; null for LPM batches.
   *
   * `Int?` in the schema, so it is a number (PSTOCK-06). This file said
   * `string` until 2026-10-01 while the phone's schema said `number | null`;
   * the phone had it right.
   */
  code: number | null;
  location: string;
  lotNumber: string;
  stockType: string;
  numberOfTrays?: number | null;
  seedsPerTray?: number | null;
  lines?: number | null;
  metersPerLine?: number | null;
  seedsPerMeter?: number | null;
  expectedPlants: number;
  seedsSown: number;
  currentStage: string;
  /** trays actually in the tunnel (SSM only); null when nothing transported */
  inTunnel: number | null;
  /** plants already harvested from this batch in this location */
  harvested?: number;
  /** expectedPlants minus harvested — what is still standing */
  remaining?: number;
  counts?: PlantCount[];
  countSummary?: CountSummary;
  createdAt: string;
  updatedAt: string;
}
