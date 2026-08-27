import cron from "node-cron";

import { sendBudgetAlertEmail } from "../lib/mailer.js";
import { prisma } from "../lib/prisma.js";

type AlertLevel = "NEAR" | "OVER";

function levelForSpending(spent: number, budget: number): AlertLevel | null {
  if (spent > budget) return "OVER";
  if (budget > 0 && spent / budget >= 0.8) return "NEAR";
  return null;
}

/** Categorias com orçamento definido que atingiram 80% (NEAR) ou passaram (OVER) do limite este mês, ainda sem alerta enviado pra esse nível. */
export async function checkBudgetAlerts(): Promise<{ sent: number }> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const categories = await prisma.category.findMany({
    where: { monthlyBudget: { not: null } },
    include: { user: true },
  });

  if (categories.length === 0) {
    return { sent: 0 };
  }

  const categoryIds = categories.map((c) => c.id);

  const spendings = await prisma.invoiceItem.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: { in: categoryIds },
      invoice: { referenceMonth: monthStart },
    },
    _sum: { amount: true },
  });
  const spentMap = new Map(spendings.map((s) => [s.categoryId, s._sum.amount ?? 0]));

  const existingAlerts = await prisma.categoryBudgetAlert.findMany({
    where: { categoryId: { in: categoryIds }, month: monthStart },
  });
  const alreadySent = new Set(existingAlerts.map((a) => `${a.categoryId}:${a.level}`));

  let sent = 0;
  for (const category of categories) {
    const budget = category.monthlyBudget;
    if (budget == null) continue;

    const spent = spentMap.get(category.id) ?? 0;
    const level = levelForSpending(spent, budget);
    if (!level) continue;

    if (alreadySent.has(`${category.id}:${level}`)) continue;

    await sendBudgetAlertEmail(category.user.email, category.user.name, category.name, spent, budget, level);
    await prisma.categoryBudgetAlert.create({
      data: { categoryId: category.id, month: monthStart, level },
    });
    sent += 1;
  }

  return { sent };
}

/** Roda a checagem 1x por dia, às 8h15 (horário do servidor). */
export function scheduleBudgetAlerts(): void {
  cron.schedule("15 8 * * *", () => {
    checkBudgetAlerts().catch((err) => console.error("Falha ao checar alertas de orçamento:", err));
  });
}
