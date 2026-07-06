import type { ImpactAnalysisResult, ImpactedAsset, ImpactedRisk, AffectedRequirement } from "./types";

/** Neo4j query runner interface */
export interface Neo4jRunner {
  run(query: string, params: Record<string, unknown>): Promise<Array<Record<string, unknown>>>;
}

const Q1_DOWNSTREAM_ASSETS = `
  MATCH path = (failed:Asset {uid: $failedAssetId})-[:DEPENDS_ON*1..10]->(downstream:Asset)
  RETURN downstream.uid AS assetId,
         downstream.code AS code,
         downstream.name AS name,
         length(path) AS depth,
         [n IN nodes(path) | n.uid] AS path
  ORDER BY depth
`;

const Q2_ESCALATED_RISKS = `
  MATCH (failed:Asset {uid: $failedAssetId})
  MATCH (ctrl:Control)-[:PROTECTS]->(failed)
  MATCH (ctrl)-[:MITIGATES]->(risk:Risk)
  WITH risk, collect(DISTINCT ctrl.code) AS allAffectedControls
  RETURN risk.uid AS riskId,
         risk.code AS code,
         risk.title AS title,
         risk.inherentLikelihood AS originalLikelihood,
         risk.inherentLikelihood + (size(allAffectedControls) * 2) AS adjustedLikelihood,
         size(allAffectedControls) * 2 AS impactDelta,
         allAffectedControls AS affectedControls
  ORDER BY adjustedLikelihood DESC
`;

const Q3_AFFECTED_REQS = `
  MATCH (failed:Asset {uid: $failedAssetId})
  MATCH (ctrl:Control)-[:PROTECTS|APPLIES_TO]->(failed)
  MATCH (ctrl)-[:SATISFIES]->(req:Requirement)<-[:CONTAINS]-(fw:Framework)
  WITH req, fw, collect(DISTINCT ctrl.code) AS impactedControls
  RETURN req.uid AS requirementId,
         req.code AS code,
         fw.code AS frameworkCode,
         fw.name AS frameworkName,
         CASE
           WHEN size(impactedControls) >= 2 THEN 'NON_COMPLIANT'
           ELSE 'AT_RISK'
         END AS state,
         impactedControls AS impactedControls
  ORDER BY state, fw.code
`;

const Q4_FULL_GRAPH = `
  MATCH path = (failed:Asset {uid: $failedAssetId})-[:DEPENDS_ON*0..{$maxDepth}]->(a:Asset)
  RETURN a.uid AS nodeId,
         'Asset' AS label,
         a.code AS code,
         a.name AS name,
         'ASSET' AS nodeType,
         length(path) AS depth,
         [n IN nodes(path) | n.uid] AS path
  UNION
  MATCH (failed:Asset {uid: $failedAssetId})
  MATCH (ctrl:Control)-[:PROTECTS]->(failed)
  MATCH (ctrl)-[:MITIGATES]->(risk:Risk)
  RETURN risk.uid AS nodeId,
         'Risk' AS label,
         risk.code AS code,
         risk.title AS name,
         'ESCALATED_RISK' AS nodeType,
         0 AS depth,
         [failed.uid, ctrl.uid, risk.uid] AS path
  UNION
  MATCH (failed:Asset {uid: $failedAssetId})
  MATCH (ctrl:Control)-[:PROTECTS]->(failed)
  MATCH (ctrl)-[:SATISFIES]->(req:Requirement)<-[:CONTAINS]-(fw:Framework)
  RETURN req.uid AS nodeId,
         'Requirement' AS label,
         req.code AS code,
         req.name AS name,
         'AFFECTED_REQUIREMENT' AS nodeType,
         0 AS depth,
         [failed.uid, ctrl.uid, req.uid] AS path
  ORDER BY depth, nodeType
`;

export class ImpactEngine {
  private maxDepth: number;

  constructor(
    private neo4j: Neo4jRunner,
    options?: { maxDepth?: number },
  ) {
    this.maxDepth = options?.maxDepth ?? 10;
  }

  async analyze(failedAssetId: string): Promise<ImpactAnalysisResult> {
    const [assetRows, riskRows, reqRows, fullGraphRows] = await Promise.all([
      this.neo4j.run(Q1_DOWNSTREAM_ASSETS, { failedAssetId }),
      this.neo4j.run(Q2_ESCALATED_RISKS, { failedAssetId }),
      this.neo4j.run(Q3_AFFECTED_REQS, { failedAssetId }),
      this.neo4j.run(Q4_FULL_GRAPH, { failedAssetId, maxDepth: this.maxDepth }),
    ]);

    const downstreamAssets: ImpactedAsset[] = assetRows.map(r => ({
      assetId: r.assetId as string,
      code: r.code as string,
      name: r.name as string,
      depth: Number(r.depth),
      path: r.path as string[],
      failureType: Number(r.depth) === 1 ? "DEPENDENCY" : "DIRECT",
      dependencyChain: r.path as string[],
    }));

    const escalatedRisks: ImpactedRisk[] = riskRows.map(r => ({
      riskId: r.riskId as string,
      code: r.code as string,
      title: r.title as string,
      originalLikelihood: Number(r.originalLikelihood),
      adjustedLikelihood: Number(r.adjustedLikelihood),
      impactDelta: Number(r.impactDelta),
      affectedControls: r.affectedControls as string[],
    }));

    const requirementsAtRisk: AffectedRequirement[] = reqRows.map(r => ({
      requirementId: r.requirementId as string,
      code: r.code as string,
      frameworkCode: r.frameworkCode as string,
      frameworkName: r.frameworkName as string,
      state: r.state as "NON_COMPLIANT" | "AT_RISK",
      impactedControls: r.impactedControls as string[],
    }));

    const failedAssetRow = fullGraphRows.find(
      r => r.nodeType === "ASSET" && Number(r.depth) === 0,
    );

    return {
      failedAssetId,
      failedAssetCode: (failedAssetRow?.code as string) ?? "UNKNOWN",
      timestamp: new Date().toISOString(),
      downstreamAssets,
      escalatedRisks,
      requirementsAtRisk,
      traversalDepth: this.maxDepth,
      totalNodesAffected:
        downstreamAssets.length + escalatedRisks.length + requirementsAtRisk.length,
    };
  }

  async getFullGraph(failedAssetId: string): Promise<unknown[]> {
    return await this.neo4j.run(Q4_FULL_GRAPH, {
      failedAssetId,
      maxDepth: this.maxDepth,
    });
  }
}
