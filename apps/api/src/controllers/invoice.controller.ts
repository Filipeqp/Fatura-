import type { Request, Response } from "express";
import { z } from "zod";

import { BadRequestError } from "../lib/app-error.js";
import { invoiceService } from "../services/invoice.service.js";

const cardIdParamSchema = z.object({ cardId: z.string().min(1) });
const invoiceIdParamSchema = cardIdParamSchema.extend({ invoiceId: z.string().min(1) });
const itemIdParamSchema = invoiceIdParamSchema.extend({ itemId: z.string().min(1) });

const updateItemSchema = z.object({
  description: z.string().trim().min(1, "A descrição não pode ficar vazia").max(200).optional(),
  amount: z.number().finite().optional(),
  categoryId: z.string().min(1).nullable().optional(),
});

const updateInvoiceSchema = z.object({
  status: z.enum(["OPEN", "PAID", "OVERDUE"]),
});

const addItemSchema = z.object({
  description: z.string().trim().min(1, "A descrição não pode ficar vazia").max(200),
  amount: z.number().finite(),
  date: z.string().min(1, "Informe a data"),
  categoryId: z.string().min(1).nullable().optional(),
});

const searchItemsSchema = z.object({ q: z.string().trim().min(1).max(100) });

export async function uploadInvoice(req: Request, res: Response) {
  const { cardId } = cardIdParamSchema.parse(req.params);

  if (!req.file) {
    throw new BadRequestError("Envie um arquivo PDF");
  }

  const force = req.body?.force === "true";
  const result = await invoiceService.importFromPdf(cardId, req.userId!, req.file.buffer, force);

  if (result.requiresConfirmation) {
    res.status(409).json(result);
    return;
  }

  res.status(201).json({ invoice: result.invoice });
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

export async function updateInvoice(req: Request, res: Response) {
  const { cardId, invoiceId } = invoiceIdParamSchema.parse(req.params);
  const { status } = updateInvoiceSchema.parse(req.body);
  const invoice = await invoiceService.updateStatus(cardId, invoiceId, req.userId!, status);
  res.json({ invoice });
}

export async function updateItem(req: Request, res: Response) {
  const { cardId, invoiceId, itemId } = itemIdParamSchema.parse(req.params);
  const data = updateItemSchema.parse(req.body);
  const item = await invoiceService.updateItem(cardId, invoiceId, itemId, req.userId!, data);
  res.json({ item });
}

export async function categorizeInvoice(req: Request, res: Response) {
  const { cardId, invoiceId } = invoiceIdParamSchema.parse(req.params);
  const invoice = await invoiceService.categorizeExisting(cardId, invoiceId, req.userId!);
  res.json({ invoice });
}

export async function categorizeCard(req: Request, res: Response) {
  const { id: cardId } = z.object({ id: z.string().min(1) }).parse(req.params);
  const result = await invoiceService.categorizeAllForCard(cardId, req.userId!);
  res.json(result);
}

export async function addItem(req: Request, res: Response) {
  const { cardId, invoiceId } = invoiceIdParamSchema.parse(req.params);
  const data = addItemSchema.parse(req.body);
  const invoice = await invoiceService.addItem(cardId, invoiceId, req.userId!, {
    ...data,
    date: new Date(data.date),
  });
  res.status(201).json({ invoice });
}

export async function deleteItem(req: Request, res: Response) {
  const { cardId, invoiceId, itemId } = itemIdParamSchema.parse(req.params);
  const invoice = await invoiceService.removeItem(cardId, invoiceId, itemId, req.userId!);
  res.json({ invoice });
}

export async function searchItems(req: Request, res: Response) {
  const { q } = searchItemsSchema.parse(req.query);
  const items = await invoiceService.searchItems(req.userId!, q);
  res.json({ items });
}
