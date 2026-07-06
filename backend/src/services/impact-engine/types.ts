export interface ImpactedAsset {
  assetId: string;
  code: string;
  name: string;
  depth: number;
  path: string[];
  failureType: "DIRECT" | "DEPENDENCY";
  dependencyChain: string[];
}

export interface ImpactedRisk {
  riskId: string;
  code: string;
  title: string;
  originalLikelihood: number;
  adjustedLikelihood: number;
  impactDelta: number;
  affectedControls: string[];
}

export interface AffectedRequirement {
  requirementId: string;
  code: string;
  frameworkCode: string;
  frameworkName: string;
  state: "NON_COMPLIANT" | "AT_RISK";
  impactedControls: string[];
}

export interface ImpactAnalysisResult {
  failedAssetId: string;
  failedAssetCode: string;
  timestamp: string;
  downstreamAssets: ImpactedAsset[];
  escalatedRisks: ImpactedRisk[];
  requirementsAtRisk: AffectedRequirement[];
  traversalDepth: number;
  totalNodesAffected: number;
}

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface GraphRelationship {
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, unknown>;
}
