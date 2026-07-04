import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

export interface IRiskControlMap {
  _id?: string;
  riskId: string;
  controlId: string;
  frameworkCode: string;
  controlRef: string;
  mappingType: "Primary" | "Supporting";
  notes: string;
  approvedBy: string;
  source: "seed" | "manual";
  createdAt: string;
}

const collection: StoreCollection<IRiskControlMap> = getCollection<IRiskControlMap>("risk_control_maps");

export const RiskControlMap = {
  find: (filter?: Partial<IRiskControlMap>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IRiskControlMap>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  create: (data: Partial<IRiskControlMap>) => collection.create(data),
};
