import { getCollection, type MemoryCollection } from "../memory-store";

export interface IRisk {
  _id?: string;
  riskId: string;
  process: string;
  subProcess: string;
  assetSystem: string;
  ownerTeam: string;
  riskCategory: string;
  threat: string;
  vulnerability: string;
  severity: string;
  riskTitle: string;
  riskDescription: string;
  riskRef: string;
  likelihood: number;
  impactFinance: number;
  impactRegulatory: number;
  impactReputational: number;
  impactSafety: number;
  impactOperational: number;
  impactC: number;
  impactI: number;
  impactA: number;
  overallScore: number;
  riskScore: number;
  inherentLevel: string;
  existingControls: string;
  residualScore: number;
  overallRisk: string;
  treatment: string;
  status: string;
  mitigationActions: string;
  deadline: string | null;
  owner: string;
}

const collection: MemoryCollection<IRisk> = getCollection<IRisk>("risks");

export const Risk = {
  find: (filter?: Partial<IRisk>) => collection.find(filter),
  findByIdAndUpdate: (id: string, update: Partial<IRisk>, options?: { new?: boolean }) =>
    collection.findByIdAndUpdate(id, update, options),
  findByIdAndDelete: (id: string) => collection.findByIdAndDelete(id),
  findOneAndUpdate: (
    filter: Partial<IRisk>,
    updateOp: { $setOnInsert: Partial<IRisk> },
    options?: { upsert?: boolean }
  ) => collection.findOneAndUpdate(filter, updateOp, options),
  create: (data: Partial<IRisk>) => collection.create(data),
};
