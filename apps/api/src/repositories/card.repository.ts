import type { CardBrand } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

export interface CardInput {
  name: string;
  brand: CardBrand;
  lastFourDigits: string | null;
  color: string;
}

export const cardRepository = {
  findManyByUser(userId: string) {
    return prisma.card.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
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
