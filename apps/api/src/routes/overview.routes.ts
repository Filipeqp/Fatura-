import { Router } from "express";

import { getOverview } from "../controllers/overview.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const overviewRoutes = Router();

overviewRoutes.use(authenticate);
overviewRoutes.get("/", getOverview);
