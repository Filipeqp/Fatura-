import { Router } from "express";

import { createCategory, listCategories } from "../controllers/category.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);
categoryRoutes.get("/", listCategories);
categoryRoutes.post("/", createCategory);
