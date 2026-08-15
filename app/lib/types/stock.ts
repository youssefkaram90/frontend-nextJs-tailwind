export interface StockItem {
  id: string;
  productType: string;
  stockType: string;
  lotNumber: string;
  productName: string;
  supplierName: string;
  currentQuantity: number;
  createdAt: string;
  updatedAt: string;
  movements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  quantity: number;
  referenceType: string;
  referenceId: string | null;
  createdAt: string;
}

export interface StockSummary {
  [productType: string]: {
    totalQuantity: number;
    lots: number;
  };
}
