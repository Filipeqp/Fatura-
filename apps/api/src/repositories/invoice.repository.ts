import { prisma } from "../lib/prisma.js";
import type { ParsedInvoice, ParsedInvoiceItem } from "../services/invoice-parsers/types.js";

type ParsedInvoiceWithCategories = Omit<ParsedInvoice, "items"> & {
  items: (ParsedInvoiceItem & { categoryId: string | null })[];
};

export const invoiceRepository = {
  findByCardAndMonth(cardId: string, referenceMonth: Date) {
    return prisma.invoice.findUnique({
      where: { cardId_referenceMonth: { cardId, referenceMonth } },
    });
  },

  findManyByCard(cardId: string) {
    return prisma.invoice.findMany({
      where: { cardId },
      orderBy: { referenceMonth: "desc" },
      include: { items: true },
    });
  },

  findByIdForCard(id: string, cardId: string) {
    return prisma.invoice.findFirst({
      where: { id, cardId },
      include: { items: { orderBy: { date: "asc" } } },
    });
  },

  findItemForUser(itemId: string, invoiceId: string, cardId: string, userId: string) {
    return prisma.invoiceItem.findFirst({
      where: { id: itemId, invoiceId, invoice: { cardId, card: { userId } } },
    });
  },

  updateItemCategory(itemId: string, categoryId: string | null) {
    return prisma.invoiceItem.update({ where: { id: itemId }, data: { categoryId } });
  },

  updateItem(itemId: string, data: Partial<{ description: string; amount: number; categoryId: string | null }>) {
    return prisma.invoiceItem.update({ where: { id: itemId }, data });
  },

  updateStatus(id: string, status: "OPEN" | "PAID" | "OVERDUE") {
    return prisma.invoice.update({ where: { id }, data: { status } });
  },

  createItem(
    invoiceId: string,
    data: { description: string; amount: number; date: Date; categoryId?: string | null },
  ) {
    return prisma.invoiceItem.create({ data: { ...data, invoiceId } });
  },

  deleteItem(itemId: string) {
    return prisma.invoiceItem.delete({ where: { id: itemId } });
  },

  adjustTotalAmount(invoiceId: string, delta: number) {
    return prisma.invoice.update({ where: { id: invoiceId }, data: { totalAmount: { increment: delta } } });
  },

  searchItemsByUser(userId: string, query: string) {
    return prisma.invoiceItem.findMany({
      where: {
        description: { contains: query, mode: "insensitive" },
        invoice: { card: { userId } },
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        invoice: {
          select: {
            id: true,
            referenceMonth: true,
            cardId: true,
            card: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });
  },

  /** Reimportar a fatura de um mês já existente substitui os itens antigos. */
  async upsertWithItems(cardId: string, parsed: ParsedInvoiceWithCategories) {
    const existing = await this.findByCardAndMonth(cardId, parsed.referenceMonth);

    if (existing) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
      return prisma.invoice.update({
        where: { id: existing.id },
        data: {
          dueDate: parsed.dueDate,
          totalAmount: parsed.totalAmount,
          items: { create: parsed.items },
        },
        include: { items: { orderBy: { date: "asc" } } },
      });
    }

    return prisma.invoice.create({
      data: {
        cardId,
        referenceMonth: parsed.referenceMonth,
        dueDate: parsed.dueDate,
        totalAmount: parsed.totalAmount,
        items: { create: parsed.items },
      },
      include: { items: { orderBy: { date: "asc" } } },
    });
  },
};
