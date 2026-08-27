import { Router } from "express";

import { runBudgetAlertCheck, runDueDateCheck } from "../controllers/job.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const jobRoutes = Router();

jobRoutes.use(authenticate);
jobRoutes.post("/check-due-dates", runDueDateCheck);
jobRoutes.post("/check-budget-alerts", runBudgetAlertCheck);
