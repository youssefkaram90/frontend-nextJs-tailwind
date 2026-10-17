import type { HarvestedProduct } from "./harvest";

// ============================================================
// Shipments — finished goods leaving the farm
// Header + lines, mirroring Delivery / DeliveryLot.
// ============================================================

export interface ShipmentLine {
  id: string;
  shipmentId: string;
  harvestedProductId: string;
  harvestedProduct?: HarvestedProduct;
  /** how many boxes */
  boxCount: number;
  /** plants in each box */
  plantsPerBox: number;
  /** computed = boxCount × plantsPerBox */
  totalPlants: number;
  createdAt: string;
  updatedAt: string;
}

/** A truck. The name is unique, and one truck can carry many shipments. */
export interface Truck {
  id: string;
  name: string;
  /** Trailer plate — always required. */
  trailerPlateNumber: string;
  /** Tractor unit plate — optional, can change between trips. */
  truckPlateNumber: string | null;
  /** how many shipments this truck carries */
  _count?: { shipments: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTruckInput {
  name: string;
  trailerPlateNumber: string;
  truckPlateNumber?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  shipmentDate: string;
  truck: Truck;
  createdBy: string | null;
  lines: ShipmentLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentLineInput {
  harvestedProductId: string;
  boxCount: number;
  /**
   * Not sent. Plants per box belongs to the finished-goods product (a 410 box
   * and a 430 box of the same batch are separate stock), so the server always
   * uses the product's own value.
   */
  plantsPerBox?: number;
}

/**
 * A truck with everything it carries — the truck detail screen.
 *
 * The backend omits the nested `truck` on these shipments: it would just repeat
 * this truck on every row. The type says so rather than pretending otherwise.
 */
export interface TruckDetail extends Truck {
  shipments: Omit<Shipment, "truck">[];
}

export interface CreateShipmentInput {
  shipmentNumber: string;
  shipmentDate: string;
  /** The truck carrying it — chosen from the truck list. */
  truckId: string;
  lines: CreateShipmentLineInput[];
}
