import { Router } from "express";

import { searchItems } from "../controllers/invoice.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const itemRoutes = Router();

itemRoutes.use(authenticate);
itemRoutes.get("/", searchItems);
