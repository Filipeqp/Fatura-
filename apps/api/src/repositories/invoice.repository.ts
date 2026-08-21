import { prisma } from "../lib/prisma.js";
import type { ParsedInvoice } from "../services/invoice-parsers/types.js";

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

  /** Reimportar a fatura de um mês já existente substitui os itens antigos. */
  async upsertWithItems(cardId: string, parsed: ParsedInvoice) {
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
