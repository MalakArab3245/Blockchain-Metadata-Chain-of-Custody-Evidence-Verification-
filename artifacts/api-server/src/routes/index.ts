import { Router, type IRouter } from "express";
import healthRouter from "./health";
import evidenceRouter from "./evidence";
import custodyRouter from "./custody";
import dashboardRouter from "./dashboard";
import verifyRouter from "./verify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(evidenceRouter);
router.use(custodyRouter);
router.use(dashboardRouter);
router.use(verifyRouter);

export default router;
