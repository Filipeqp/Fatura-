import { prisma } from "../lib/prisma.js";
import { DEFAULT_CATEGORIES } from "../lib/default-categories.js";
import type { CategoryRule } from "../lib/categorization.js";

export const categoryRepository = {
  findManyByUser(userId: string) {
    return prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.category.findFirst({ where: { id, userId } });
  },

  findRulesByUser(userId: string): Promise<CategoryRule[]> {
    return prisma.categoryRule.findMany({ where: { userId }, select: { keyword: true, categoryId: true } });
  },

  create(userId: string, data: { name: string; color: string }) {
    return prisma.category.create({ data: { ...data, userId } });
  },

  /** Cria o conjunto padrão de categorias e regras de palavra-chave para um usuário novo. */
  async seedDefaults(userId: string) {
    await prisma.$transaction(async (tx) => {
      for (const def of DEFAULT_CATEGORIES) {
        const category = await tx.category.create({
          data: { userId, name: def.name, color: def.color },
        });

        if (def.keywords.length > 0) {
          await tx.categoryRule.createMany({
            data: def.keywords.map((keyword) => ({ userId, categoryId: category.id, keyword })),
          });
        }
      }
    });
  },
};
