import { getCollection, type MemoryCollection } from "../memory-store";

export interface IMetricMapping {
  _id?: string;
  riskId: string;
  metricType: 'KPI' | 'KRI';
  metricCatalogId: string;
  mappingType: string;
  createdAt: string;
}

const collection: MemoryCollection<IMetricMapping> = getCollection<IMetricMapping>("metric_mappings");

export const MetricMapping = {
  find: (filter?: Partial<IMetricMapping>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IMetricMapping>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  findOneAndUpdate: (
    filter: Partial<IMetricMapping>,
    updateOp: { $setOnInsert: Partial<IMetricMapping> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IMetricMapping>) => collection.create(data),
};
