import { ProductType, StockType } from './delivery';

export enum FieldLocation {
  GREENHOUSE = 'GREENHOUSE',
  FIELD = 'FIELD',
}

export interface PlantStock {
  id: string;
  sowingId: string;
  cropType: string;
  location: string;
  lotNumber: string;
  stockType: string;
  numberOfTrays: number | null;
  seedsPerTray: number | null;
  expectedPlants: number;
  currentStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sowing {
  id: string;
  cropType: string;
  sowingDate: string;
  greenhouse: string;
  lotNumber: string;
  productType: string;
  stockType: string;
  quantityUsed: number;
  numberOfTrays: number | null;
  seedsPerTray: number | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  plantStock: PlantStock | null;
}

export interface CreateSowingDto {
  cropType: string;
  sowingDate: Date;
  greenhouse: FieldLocation;
  lotNumber: string;
  productType: ProductType;
  stockType: StockType;
  quantityUsed: number;
  numberOfTrays?: number;
  seedsPerTray?: number;
  remarks?: string;
}
