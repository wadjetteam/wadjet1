import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

export interface IControlRejectionLog {
  _id?: string;
  riskId: string;
  controlId: string;
  frameworkCode: string;
  controlRef: string;
  count: number;
  lastRejectedAt: string;
  createdAt: string;
}

const collection: StoreCollection<IControlRejectionLog> = getCollection<IControlRejectionLog>("control_rejection_logs");

export const ControlRejectionLog = {
  find: (filter?: Partial<IControlRejectionLog>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IControlRejectionLog>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findOneAndUpdate: (
    filter: Partial<IControlRejectionLog>,
    updateOp: { $setOnInsert: Partial<IControlRejectionLog> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IControlRejectionLog>) => collection.create(data),
};
