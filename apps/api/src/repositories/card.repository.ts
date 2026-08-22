import type { CardBrand } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

export interface CardInput {
  name: string;
  brand: CardBrand;
  lastFourDigits: string | null;
  color: string;
}

export const cardRepository = {
  async findManyByUser(userId: string) {
    const cards = await prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { invoices: true } } },
    });

    return Promise.all(
      cards.map(async (card) => ({
        ...card,
        itemCount: await prisma.invoiceItem.count({ where: { invoice: { cardId: card.id } } }),
      })),
    );
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.card.findFirst({ where: { id, userId } });
  },

  create(userId: string, data: CardInput) {
    return prisma.card.create({ data: { ...data, userId } });
  },

  update(id: string, data: Partial<CardInput>) {
    return prisma.card.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.card.delete({ where: { id } });
  },
};
