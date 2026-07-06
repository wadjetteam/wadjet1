import { Router } from "express";
import operationalLossRouter from "./operational-loss";
import tprmRouter from "./tprm";
import regulatoryCalendarRouter from "./regulatory-calendar";
import examinationsRouter from "./examinations";

const router = Router();

router.use(operationalLossRouter);
router.use(tprmRouter);
router.use(regulatoryCalendarRouter);
router.use(examinationsRouter);

export default router;
