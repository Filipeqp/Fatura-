import type { Request, Response } from "express";
import { z } from "zod";

import { categoryService } from "../services/category.service.js";

const nameField = z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(30);
const colorField = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

const monthlyBudgetField = z.number().positive("O orçamento deve ser maior que zero").nullable();

const createCategorySchema = z.object({ name: nameField, color: colorField });
const updateCategorySchema = z.object({
  name: nameField.optional(),
  color: colorField.optional(),
  monthlyBudget: monthlyBudgetField.optional(),
});
const addRuleSchema = z.object({
  keyword: z.string().trim().min(2, "A palavra-chave deve ter pelo menos 2 caracteres").max(40),
});

const idParamSchema = z.object({ id: z.string().min(1) });
const ruleParamSchema = idParamSchema.extend({ ruleId: z.string().min(1) });

export async function listCategories(req: Request, res: Response) {
  const categories = await categoryService.list(req.userId!);
  res.json({ categories });
}

export async function createCategory(req: Request, res: Response) {
  const data = createCategorySchema.parse(req.body);
  const category = await categoryService.create(req.userId!, data);
  res.status(201).json({ category });
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = updateCategorySchema.parse(req.body);
  const category = await categoryService.update(id, req.userId!, data);
  res.json({ category });
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await categoryService.remove(id, req.userId!);
  res.status(204).send();
}

export async function seedDefaultCategories(req: Request, res: Response) {
  await categoryService.seedMissingDefaults(req.userId!);
  const categories = await categoryService.list(req.userId!);
  res.json({ categories });
}

export async function addCategoryRule(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { keyword } = addRuleSchema.parse(req.body);
  const rule = await categoryService.addRule(id, req.userId!, keyword);
  res.status(201).json({ rule });
}

export async function deleteCategoryRule(req: Request, res: Response) {
  const { ruleId } = ruleParamSchema.parse(req.params);
  await categoryService.removeRule(ruleId, req.userId!);
  res.status(204).send();
}
