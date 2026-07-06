import { Router } from "express";
import { asyncHandler, AppError } from "../middleware/error-handler";
import { ImpactEngine } from "../services/impact-engine";
import type { Neo4jRunner } from "../services/impact-engine";

const stubNeo4j: Neo4jRunner = {
  async run(_query, _params) {
    return [];
  },
};

const QUERIES = [
  { name: "downstream_assets", query: "MATCH path = (failed:Asset {uid: $failedAssetId})-[:DEPENDS_ON*1..10]->(downstream:Asset) RETURN ..." },
  { name: "escalated_risks", query: "MATCH (failed:Asset {uid: $failedAssetId}) MATCH (ctrl:Control)-[:PROTECTS]->(failed) MATCH (ctrl)-[:MITIGATES]->(risk:Risk) RETURN ..." },
  { name: "affected_requirements", query: "MATCH (failed:Asset {uid: $failedAssetId}) MATCH (ctrl:Control)-[:PROTECTS|APPLIES_TO]->(failed) MATCH (ctrl)-[:SATISFIES]->(req:Requirement)<-[:CONTAINS]-(fw:Framework) RETURN ..." },
  { name: "full_graph", query: "MATCH path = (failed:Asset {uid: $failedAssetId})-[:DEPENDS_ON*0..$maxDepth]->(a:Asset) RETURN ..." },
];

const router = Router();
const engine = new ImpactEngine(stubNeo4j);

router.post("/analyze", asyncHandler(async (req, res) => {
  const { failedAssetId, failedAssetCode } = req.body;
  if (!failedAssetId) throw new AppError(400, "failedAssetId is required");

  const result = await engine.analyze(failedAssetId);
  result.failedAssetCode = failedAssetCode ?? result.failedAssetCode;
  res.json({ result });
}));

router.get("/queries", asyncHandler(async (_req, res) => {
  res.json({ queries: QUERIES });
}));

export default router;
