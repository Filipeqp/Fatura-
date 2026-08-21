import type { Request, Response } from "express";
import { z } from "zod";

import { BadRequestError } from "../lib/app-error.js";
import { invoiceService } from "../services/invoice.service.js";

const cardIdParamSchema = z.object({ cardId: z.string().min(1) });
const invoiceIdParamSchema = cardIdParamSchema.extend({ invoiceId: z.string().min(1) });
const itemIdParamSchema = invoiceIdParamSchema.extend({ itemId: z.string().min(1) });
const updateItemCategorySchema = z.object({ categoryId: z.string().min(1).nullable() });

export async function uploadInvoice(req: Request, res: Response) {
  const { cardId } = cardIdParamSchema.parse(req.params);

  if (!req.file) {
    throw new BadRequestError("Envie um arquivo PDF");
  }

  const invoice = await invoiceService.importFromPdf(cardId, req.userId!, req.file.buffer);
  res.status(201).json({ invoice });
}

export async function listInvoices(req: Request, res: Response) {
  const { cardId } = cardIdParamSchema.parse(req.params);
  const invoices = await invoiceService.list(cardId, req.userId!);
  res.json({ invoices });
}

export async function getInvoice(req: Request, res: Response) {
  const { cardId, invoiceId } = invoiceIdParamSchema.parse(req.params);
  const invoice = await invoiceService.get(cardId, invoiceId, req.userId!);
  res.json({ invoice });
}

export async function updateItemCategory(req: Request, res: Response) {
  const { cardId, invoiceId, itemId } = itemIdParamSchema.parse(req.params);
  const { categoryId } = updateItemCategorySchema.parse(req.body);
  const item = await invoiceService.updateItemCategory(cardId, invoiceId, itemId, req.userId!, categoryId);
  res.json({ item });
}

export async function categorizeInvoice(req: Request, res: Response) {
  const { cardId, invoiceId } = invoiceIdParamSchema.parse(req.params);
  const invoice = await invoiceService.categorizeExisting(cardId, invoiceId, req.userId!);
  res.json({ invoice });
}
