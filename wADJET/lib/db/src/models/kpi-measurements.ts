import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

export interface IKpiMeasurement {
  _id?: string;
  catalogId: string;
  period: string;
  currentValue?: number;
  status: 'Draft' | 'Pending Review' | 'Approved';
  appetiteStatus?: 'Green' | 'Amber' | 'Red';
  evidenceFilePath?: string;
  comments?: string;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const collection: StoreCollection<IKpiMeasurement> = getCollection<IKpiMeasurement>("kpi_measurements");

export const KpiMeasurement = {
  find: (filter?: Partial<IKpiMeasurement>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IKpiMeasurement>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  findOneAndUpdate: (
    filter: Partial<IKpiMeasurement>,
    updateOp: { $setOnInsert: Partial<IKpiMeasurement> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IKpiMeasurement>) => collection.create(data),
};
