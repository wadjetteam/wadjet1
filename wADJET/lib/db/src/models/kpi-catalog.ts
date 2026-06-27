import { getCollection, type MemoryCollection } from "../memory-store";

export interface IKpiCatalog {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  businessUnit: string;
  department: string;
  ownerId: string;
  reviewerId?: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
  calculationType: 'Manual' | 'Calculated' | 'Integrated';
  calculationFormula?: string;
  apiEndpoint?: string;
  apiJsonKey?: string;
  targetValue: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const collection: MemoryCollection<IKpiCatalog> = getCollection<IKpiCatalog>("kpi_catalog");

export const KpiCatalog = {
  find: (filter?: Partial<IKpiCatalog>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IKpiCatalog>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  findOneAndUpdate: (
    filter: Partial<IKpiCatalog>,
    updateOp: { $setOnInsert: Partial<IKpiCatalog> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IKpiCatalog>) => collection.create(data),
};
