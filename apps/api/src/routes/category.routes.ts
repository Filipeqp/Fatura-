import { Router } from "express";

import {
  addCategoryRule,
  createCategory,
  deleteCategory,
  deleteCategoryRule,
  listCategories,
  seedDefaultCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);

categoryRoutes.get("/", listCategories);
categoryRoutes.post("/", createCategory);
categoryRoutes.post("/seed-defaults", seedDefaultCategories);
categoryRoutes.patch("/:id", updateCategory);
categoryRoutes.delete("/:id", deleteCategory);
categoryRoutes.post("/:id/rules", addCategoryRule);
categoryRoutes.delete("/:id/rules/:ruleId", deleteCategoryRule);
