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
