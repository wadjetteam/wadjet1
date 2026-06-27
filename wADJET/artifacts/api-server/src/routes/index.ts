import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import risksRouter from "./risks";
import kpiCatalogRouter from "./kpi-catalog";
import kriCatalogRouter from "./kri-catalog";
import kpiMeasurementRouter from "./kpi-measurements";
import kriMeasurementRouter from "./kri-measurements";
import breachEngineRouter from "./breach-engine";
import metricMappingRouter from "./metric-mappings";
import regulatoryReportingRouter from "./regulatory-reporting";
import collectionEngineRouter from "./collection-engine";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(risksRouter);
router.use(kpiCatalogRouter);
router.use(kriCatalogRouter);
router.use(kpiMeasurementRouter);
router.use(kriMeasurementRouter);
router.use(breachEngineRouter);
router.use(metricMappingRouter);
router.use(regulatoryReportingRouter);
router.use(collectionEngineRouter);

export default router;
