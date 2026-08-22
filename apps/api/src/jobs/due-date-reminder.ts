import cron from "node-cron";

import { sendDueDateReminderEmail } from "../lib/mailer.js";
import { prisma } from "../lib/prisma.js";

const REMINDER_DAYS_BEFORE = 5;

/** Faturas com vencimento exatamente daqui a REMINDER_DAYS_BEFORE dias, ainda não pagas e sem lembrete enviado. */
export async function checkUpcomingDueDates(): Promise<{ sent: number }> {
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + REMINDER_DAYS_BEFORE);
  const startOfDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()));
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const invoices = await prisma.invoice.findMany({
    where: {
      status: { not: "PAID" },
      reminderSentAt: null,
      dueDate: { gte: startOfDay, lt: endOfDay },
    },
    include: { card: { include: { user: true } } },
  });

  let sent = 0;
  for (const invoice of invoices) {
    await sendDueDateReminderEmail(
      invoice.card.user.email,
      invoice.card.user.name,
      invoice.card.name,
      invoice.dueDate,
      invoice.totalAmount,
    );
    await prisma.invoice.update({ where: { id: invoice.id }, data: { reminderSentAt: new Date() } });
    sent += 1;
  }

  return { sent };
}

/** Roda a checagem 1x por dia, às 8h (horário do servidor). */
export function scheduleDueDateReminders(): void {
  cron.schedule("0 8 * * *", () => {
    checkUpcomingDueDates().catch((err) => console.error("Falha ao checar vencimentos:", err));
  });
}
