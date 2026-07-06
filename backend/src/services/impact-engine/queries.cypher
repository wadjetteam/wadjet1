// ============================================================
// CASCADING RISK IMPACT ENGINE — Neo4j Cypher Queries
// ============================================================
// These queries are deterministic graph traversals.
// No ML, no heuristics — pure structural propagation.

// -------------------------------------------------------
// Q1: All downstream assets affected by a failed asset
//     Traverses :DEPENDS_ON directed edges transitively
// -------------------------------------------------------
// Input: $failedAssetId
// Returns: {asset, depth, path}
//
// MATCH path = (failed:Asset {uid: $failedAssetId})-[:DEPENDS_ON*1..10]->(downstream:Asset)
// RETURN downstream.uid AS assetId,
//        downstream.code AS code,
//        downstream.name AS name,
//        length(path) AS depth,
//        [n IN nodes(path) | n.uid] AS path
// ORDER BY depth

// -------------------------------------------------------
// Q2: Risks whose likelihood increases because controls
//     protecting the failed asset are now compromised
// -------------------------------------------------------
// Input: $failedAssetId
// Returns: {risk, originalLikelihood, adjustedLikelihood, affectedControls}
//
// MATCH (failed:Asset {uid: $failedAssetId})
// MATCH (ctrl:Control)-[:PROTECTS]->(failed)
// MATCH (ctrl)-[:MITIGATES]->(risk:Risk)
// OPTIONAL MATCH (ctrl2:Control)-[:PROTECTS]->(failed)
// WITH risk, collect(DISTINCT ctrl.uid + ':' + ctrl.code) AS allAffectedControls
// RETURN risk.uid AS riskId,
//        risk.code AS code,
//        risk.title AS title,
//        risk.inherentLikelihood AS originalLikelihood,
//        risk.inherentLikelihood + (size(allAffectedControls) * 2) AS adjustedLikelihood,
//        size(allAffectedControls) * 2 AS impactDelta,
//        allAffectedControls AS affectedControls
// ORDER BY adjustedLikelihood DESC

// -------------------------------------------------------
// Q3: Regulatory requirements now in non-compliant/at-risk state
//     because controls satisfying them are tied to failed asset
// -------------------------------------------------------
// Input: $failedAssetId
// Returns: {requirement, framework, state, impactedControls}
//
// MATCH (failed:Asset {uid: $failedAssetId})
// MATCH (ctrl:Control)-[:PROTECTS|APPLIES_TO]->(failed)
// MATCH (ctrl)-[:SATISFIES]->(req:Requirement)<-[:CONTAINS]-(fw:Framework)
// WITH req, fw, collect(DISTINCT ctrl.code) AS impactedControls
// RETURN req.uid AS requirementId,
//        req.code AS code,
//        fw.code AS frameworkCode,
//        fw.name AS frameworkName,
//        CASE
//          WHEN size(impactedControls) >= 2 THEN 'NON_COMPLIANT'
//          ELSE 'AT_RISK'
//        END AS state,
//        impactedControls AS impactedControls
// ORDER BY state, fw.code

// -------------------------------------------------------
// Q4: Combined traversal — single query returning all paths
//     for a full dashboard visualisation
// -------------------------------------------------------
// Input: $failedAssetId
//
// CALL {
//   MATCH path = (failed:Asset {uid: $failedAssetId})-[:DEPENDS_ON*0..10]->(a:Asset)
//   RETURN a AS node, 'ASSET' AS nodeType, length(path) AS depth, [n IN nodes(path) | n.uid] AS path
//   UNION
//   MATCH (failed:Asset {uid: $failedAssetId})
//   MATCH (ctrl:Control)-[:PROTECTS]->(failed)
//   MATCH (ctrl)-[:MITIGATES]->(risk:Risk)
//   RETURN risk AS node, 'ESCALATED_RISK' AS nodeType, 0 AS depth, [failed.uid, ctrl.uid, risk.uid] AS path
//   UNION
//   MATCH (failed:Asset {uid: $failedAssetId})
//   MATCH (ctrl:Control)-[:PROTECTS]->(failed)
//   MATCH (ctrl)-[:SATISFIES]->(req:Requirement)<-[:CONTAINS]-(fw:Framework)
//   RETURN req AS node, 'AFFECTED_REQUIREMENT' AS nodeType, 0 AS depth, [failed.uid, ctrl.uid, req.uid] AS path
// }
// RETURN DISTINCT node.uid AS nodeId,
//        labels(node) AS labels,
//        node.code AS code,
//        node.name AS name,
//        nodeType,
//        depth,
//        path
// ORDER BY depth, nodeType
