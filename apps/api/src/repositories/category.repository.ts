import { prisma } from "../lib/prisma.js";
import { DEFAULT_CATEGORIES } from "../lib/default-categories.js";
import type { CategoryRule } from "../lib/categorization.js";

export const categoryRepository = {
  async findManyByUser(userId: string) {
    const categories = await prisma.category.findMany({
      where: { userId },
      include: { rules: true, _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    });

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const spendings = await prisma.invoiceItem.groupBy({
      by: ["categoryId"],
      where: {
        categoryId: { in: categories.map((c) => c.id) },
        invoice: { card: { userId }, referenceMonth: monthStart },
      },
      _sum: { amount: true },
    });

    const spentMap = new Map(spendings.map((s) => [s.categoryId, s._sum.amount ?? 0]));

    return categories.map((category) => ({
      ...category,
      spentThisMonth: spentMap.get(category.id) ?? 0,
    }));
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

  update(id: string, data: Partial<{ name: string; color: string; monthlyBudget: number | null }>) {
    return prisma.category.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.category.delete({ where: { id } });
  },

  createRule(userId: string, categoryId: string, keyword: string) {
    return prisma.categoryRule.create({ data: { userId, categoryId, keyword } });
  },

  findRuleForUser(id: string, userId: string) {
    return prisma.categoryRule.findFirst({ where: { id, userId } });
  },

  removeRule(id: string) {
    return prisma.categoryRule.delete({ where: { id } });
  },

  /** Cria o conjunto padrão de categorias e regras do zero (usuário novo). */
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

  /**
   * Preenche as categorias padrão que ainda não existem (comparando nome sem
   * diferenciar maiúsculas/minúsculas) e anexa só as palavras-chave que faltam —
   * nunca duplica categoria nem palavra-chave já existente do usuário.
   */
  async seedMissingDefaults(userId: string) {
    const existing = await prisma.category.findMany({ where: { userId }, include: { rules: true } });
    const byLowerName = new Map(existing.map((c) => [c.name.toLowerCase(), c]));
    const usedKeywords = new Set(existing.flatMap((c) => c.rules.map((r) => r.keyword.toUpperCase())));

    await prisma.$transaction(async (tx) => {
      for (const def of DEFAULT_CATEGORIES) {
        let category = byLowerName.get(def.name.toLowerCase());

        if (!category) {
          category = { ...(await tx.category.create({ data: { userId, name: def.name, color: def.color } })), rules: [] };
        }

        const missingKeywords = def.keywords.filter((keyword) => !usedKeywords.has(keyword.toUpperCase()));
        missingKeywords.forEach((keyword) => usedKeywords.add(keyword.toUpperCase()));

        if (missingKeywords.length > 0) {
          await tx.categoryRule.createMany({
            data: missingKeywords.map((keyword) => ({ userId, categoryId: category!.id, keyword })),
            skipDuplicates: true,
          });
        }
      }
    });
  },
};
