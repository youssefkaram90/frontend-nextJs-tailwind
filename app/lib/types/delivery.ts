export enum StockType {
  BIO = "BIO",
  CVT = "CVT",
}

export enum ProductType {
  SEEDS = "SEEDS",
  PEAT = "PEAT",
}

export interface DeliveryLot {
  id: string;
  deliveryId: string;
  lotNumber: string;
  stockType: string;
  quantity: number;
  thousandSeedsPerGram: number | null;
  productType: string;
  productName: string;
  supplierName: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  deliveryDate: string;
  deliveryCode: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  lots: DeliveryLot[];
}

export interface LotsDto {
  lotNumber: string;
  quantity: number;
  thousandSeedsPerGram?: number;
  productType: ProductType;
  productName: string;
  supplierName: string;
  stockType: StockType;
}

export interface CreateDeliveryDto {
  deliveryCode: string;
  deliveryDate: string;
  remark?: string;
  lots: LotsDto[];
}
