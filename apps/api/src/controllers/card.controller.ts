import type { Request, Response } from "express";
import { z } from "zod";

import { cardService } from "../services/card.service.js";

const CARD_BRANDS = ["VISA", "MASTERCARD", "ELO", "AMEX", "OTHER"] as const;

const nameField = z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(40);
const brandField = z.enum(CARD_BRANDS);
const lastFourDigitsField = z
  .string()
  .regex(/^\d{4}$/, "Deve ter exatamente 4 dígitos")
  .nullable()
  .optional();
const colorField = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

const cardSchema = z.object({
  name: nameField,
  brand: brandField.default("OTHER"),
  lastFourDigits: lastFourDigitsField,
  color: colorField,
});

// Sem .partial() em cima de cardSchema: o .default("OTHER") do brand seria
// reaplicado sempre que o campo vier ausente, sobrescrevendo o valor atual.
const updateCardSchema = z.object({
  name: nameField.optional(),
  brand: brandField.optional(),
  lastFourDigits: lastFourDigitsField,
  color: colorField.optional(),
});
const idParamSchema = z.object({ id: z.string().min(1) });

export async function listCards(req: Request, res: Response) {
  const cards = await cardService.list(req.userId!);
  res.json({ cards });
}

export async function getCard(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const card = await cardService.get(id, req.userId!);
  res.json({ card });
}

export async function createCard(req: Request, res: Response) {
  const data = cardSchema.parse(req.body);
  const card = await cardService.create(req.userId!, { ...data, lastFourDigits: data.lastFourDigits ?? null });
  res.status(201).json({ card });
}

export async function updateCard(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = updateCardSchema.parse(req.body);
  const card = await cardService.update(id, req.userId!, data);
  res.json({ card });
}

export async function deleteCard(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await cardService.remove(id, req.userId!);
  res.status(204).send();
}
