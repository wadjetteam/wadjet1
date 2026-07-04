import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

export interface IKriMeasurement {
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
  previousValue?: number;
  percentageChange?: number;
  trendDirection?: 'Increasing' | 'Stable' | 'Decreasing';
  createdAt: string;
  updatedAt: string;
}

const collection: StoreCollection<IKriMeasurement> = getCollection<IKriMeasurement>("kri_measurements");

export const KriMeasurement = {
  find: (filter?: Partial<IKriMeasurement>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IKriMeasurement>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  findOneAndUpdate: (
    filter: Partial<IKriMeasurement>,
    updateOp: { $setOnInsert: Partial<IKriMeasurement> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IKriMeasurement>) => collection.create(data),
};
