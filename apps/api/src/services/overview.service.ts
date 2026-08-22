import { prisma } from "../lib/prisma.js";

const MONTHS_BACK = 6;

function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

interface Commitment {
  description: string;
  cardName: string;
  cardColor: string;
  currentInstallment: number;
  totalInstallments: number;
  remainingInstallments: number;
  amount: number;
  remainingAmount: number;
}

export const overviewService = {
  async get(userId: string) {
    const now = new Date();
    const currentMonthStart = startOfMonthUTC(now);
    const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_BACK - 1), 1));

    const invoices = await prisma.invoice.findMany({
      where: { card: { userId }, referenceMonth: { gte: rangeStart } },
      select: { referenceMonth: true, totalAmount: true },
    });

    const monthlyMap = new Map<string, number>();
    for (let i = 0; i < MONTHS_BACK; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTHS_BACK - 1 - i), 1));
      monthlyMap.set(monthKey(d), 0);
    }
    for (const invoice of invoices) {
      const key = monthKey(invoice.referenceMonth);
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + invoice.totalAmount);
      }
    }
    const monthly = Array.from(monthlyMap.entries()).map(([key, total]) => ({
      month: `${key}-01T00:00:00.000Z`,
      total,
    }));

    const currentMonthTotal = monthly[monthly.length - 1]?.total ?? 0;

    const currentMonthItems = await prisma.invoiceItem.findMany({
      where: { invoice: { card: { userId }, referenceMonth: currentMonthStart } },
      include: { category: true },
    });

    const categoryTotals = new Map<string, { categoryId: string | null; name: string; color: string | null; amount: number }>();
    for (const item of currentMonthItems) {
      const key = item.categoryId ?? "__uncategorized";
      const existing = categoryTotals.get(key);
      if (existing) {
        existing.amount += item.amount;
      } else {
        categoryTotals.set(key, {
          categoryId: item.categoryId,
          name: item.category?.name ?? "Sem categoria",
          color: item.category?.color ?? null,
          amount: item.amount,
        });
      }
    }

    const categoryBreakdown = Array.from(categoryTotals.values()).sort((a, b) => b.amount - a.amount);

    const cards = await prisma.card.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        color: true,
        invoices: {
          orderBy: { referenceMonth: "desc" },
          take: 1,
          include: { items: { where: { installment: { not: null } } } },
        },
      },
    });

    const commitments: Commitment[] = [];
    for (const card of cards) {
      const latestInvoice = card.invoices[0];
      if (!latestInvoice) continue;

      for (const item of latestInvoice.items) {
        if (!item.installment) continue;
        const [currentStr, totalStr] = item.installment.split("/");
        const current = Number(currentStr);
        const totalCount = Number(totalStr);
        if (!Number.isFinite(current) || !Number.isFinite(totalCount)) continue;

        const remaining = totalCount - current;
        if (remaining <= 0) continue;

        commitments.push({
          description: item.description,
          cardName: card.name,
          cardColor: card.color,
          currentInstallment: current,
          totalInstallments: totalCount,
          remainingInstallments: remaining,
          amount: item.amount,
          remainingAmount: remaining * item.amount,
        });
      }
    }

    commitments.sort((a, b) => b.remainingAmount - a.remainingAmount);
    const totalCommitmentAmount = commitments.reduce((sum, c) => sum + c.remainingAmount, 0);

    return {
      monthly,
      currentMonthTotal,
      categoryBreakdown,
      commitments,
      totalCommitmentAmount,
      cardCount: cards.length,
    };
  },
};
