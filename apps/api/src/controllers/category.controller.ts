import type { Request, Response } from "express";
import { z } from "zod";

import { categoryService } from "../services/category.service.js";

const createCategorySchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
});

export async function listCategories(req: Request, res: Response) {
  const categories = await categoryService.list(req.userId!);
  res.json({ categories });
}

export async function createCategory(req: Request, res: Response) {
  const data = createCategorySchema.parse(req.body);
  const category = await categoryService.create(req.userId!, data);
  res.status(201).json({ category });
}
