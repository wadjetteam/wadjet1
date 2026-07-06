import { Router } from "express";
import healthRouter from "./health";
import risksRouter from "./risks";
import complianceRouter from "./compliance";
import evidenceRouter from "./evidence";
import riskControlMapRouter from "./risk-control-maps";
import bankingRouter from "./banking";
import userManagementRouter from "./user-management-router";
import evidenceConnectorRouter from "./evidence-connector-router";
import impactRouter from "./impact-router";
import reportingRouter from "./reporting-router";
import auditTrailRouter from "./audit-trail-router";

const router = Router();

router.use(healthRouter);
router.use(risksRouter);
router.use(complianceRouter);
router.use(evidenceRouter);
router.use(riskControlMapRouter);
router.use(bankingRouter);
router.use("/users-management", userManagementRouter);
router.use("/evidence-connector", evidenceConnectorRouter);
router.use("/impact", impactRouter);
router.use("/reporting", reportingRouter);
router.use("/audit-trail", auditTrailRouter);

export default router;
