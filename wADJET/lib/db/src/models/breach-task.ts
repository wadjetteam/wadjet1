import { getCollection, type MemoryCollection } from "../memory-store";

export interface IBreachTask {
  _id?: string;
  kriMeasurementId: string;
  kriCatalogId: string;
  riskOwnerId: string;
  deptHeadId?: string;
  croId?: string;
  ceoId?: string;
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

const collection: MemoryCollection<IBreachTask> = getCollection<IBreachTask>("breach_tasks");

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
