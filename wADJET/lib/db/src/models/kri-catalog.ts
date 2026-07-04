import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

export interface IKriCatalog {
  _id?: string;
  code: string;
  name: string;
  riskCategory: string;
  linkedRiskId?: string;
  riskOwnerId: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
  greenMin?: number;
  greenMax?: number;
  amberMin?: number;
  amberMax?: number;
  redMin?: number;
  redMax?: number;
  isIntegrated: boolean;
  apiEndpoint?: string;
  apiJsonKey?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const collection: StoreCollection<IKriCatalog> = getCollection<IKriCatalog>("kri_catalog");

export const KriCatalog = {
  find: (filter?: Partial<IKriCatalog>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IKriCatalog>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  findOneAndUpdate: (
    filter: Partial<IKriCatalog>,
    updateOp: { $setOnInsert: Partial<IKriCatalog> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IKriCatalog>) => collection.create(data),
};
