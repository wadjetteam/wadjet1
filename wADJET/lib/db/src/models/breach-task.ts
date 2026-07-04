import { getCollection } from "../memory-store";
import type { StoreCollection } from "../store-types";

export interface IBreachTask {
  _id?: string;
  kriMeasurementId: string;
  kriCatalogId: string;
  riskOwnerId: string;
  deptHeadId?: string;
  croId?: string;
  ceoId?: string;
  breachType: 'cyber' | 'operational' | 'compliance';
  escalationLevel: 'Level0_Owner' | 'Level1_DeptHead' | 'Level2_CRO_CEO';
  title: string;
  description?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  dueBy: string;
  resolvedAt?: string;
  rootCauseAnalysis?: string;
  evidenceFilePath?: string;
  level0EscalatedAt?: string;
  level1EscalatedAt?: string;
  level2EscalatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const collection: StoreCollection<IBreachTask> = getCollection<IBreachTask>("breach_tasks");

export const BreachTask = {
  find: (filter?: Partial<IBreachTask>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IBreachTask>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  findOneAndUpdate: (
    filter: Partial<IBreachTask>,
    updateOp: { $setOnInsert: Partial<IBreachTask> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IBreachTask>) => collection.create(data),
};
