import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Fatura+ <onboarding@resend.dev>";

const dueDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.CORS_ORIGIN}/redefinir-senha?token=${resetToken}`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY não configurada — link de redefinição para ${to}: ${resetUrl}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Redefinir sua senha — Fatura+",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0d9488;">Redefinir senha</h2>
        <p>Olá, ${name}. Recebemos uma solicitação para redefinir a senha da sua conta no Fatura+.</p>
        <p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 20px; background: #0d9488; color: #fff; text-decoration: none; border-radius: 8px;"
          >
            Redefinir senha
          </a>
        </p>
        <p>Se você não pediu isso, pode ignorar este e-mail com segurança.</p>
        <p style="color: #6b7280; font-size: 12px;">Este link expira em 1 hora.</p>
      </div>
    `,
  });
}

export async function sendBudgetAlertEmail(
  to: string,
  name: string,
  categoryName: string,
  spent: number,
  budget: number,
  level: "NEAR" | "OVER",
): Promise<void> {
  const formattedSpent = currencyFormatter.format(spent);
  const formattedBudget = currencyFormatter.format(budget);
  const percentage = Math.round((spent / budget) * 100);

  const subject =
    level === "OVER"
      ? `Orçamento de ${categoryName} estourado — Fatura+`
      : `Você já usou ${percentage}% do orçamento de ${categoryName} — Fatura+`;

  const headline = level === "OVER" ? "Orçamento estourado" : "Orçamento quase no limite";

  const body =
    level === "OVER"
      ? `Olá, ${name}. Você já gastou <strong>${formattedSpent}</strong> em <strong>${categoryName}</strong> este mês, passando do orçamento de <strong>${formattedBudget}</strong>.`
      : `Olá, ${name}. Você já gastou <strong>${formattedSpent}</strong> em <strong>${categoryName}</strong> este mês — <strong>${percentage}%</strong> do orçamento de <strong>${formattedBudget}</strong>.`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY não configurada — alerta de orçamento (${level}) para ${to}: ${categoryName} ${formattedSpent}/${formattedBudget}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0d9488;">${headline}</h2>
        <p>${body}</p>
        <p>
          <a
            href="${process.env.CORS_ORIGIN}/categorias"
            style="display: inline-block; padding: 12px 20px; background: #0d9488; color: #fff; text-decoration: none; border-radius: 8px;"
          >
            Ver categorias no Fatura+
          </a>
        </p>
        <p style="color: #6b7280; font-size: 12px;">Você recebeu este e-mail porque definiu um orçamento mensal para esta categoria no Fatura+.</p>
      </div>
    `,
  });
}

export async function sendDueDateReminderEmail(
  to: string,
  name: string,
  cardName: string,
  dueDate: Date,
  totalAmount: number,
): Promise<void> {
  const formattedDate = dueDateFormatter.format(dueDate);
  const formattedAmount = currencyFormatter.format(totalAmount);

  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY não configurada — lembrete de vencimento para ${to}: ${cardName} vence em ${formattedDate}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Sua fatura do ${cardName} vence em 5 dias — Fatura+`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0d9488;">Fatura próxima do vencimento</h2>
        <p>Olá, ${name}. A fatura do cartão <strong>${cardName}</strong> vence em <strong>${formattedDate}</strong>, no valor de <strong>${formattedAmount}</strong>.</p>
        <p>
          <a
            href="${process.env.CORS_ORIGIN}/dashboard"
            style="display: inline-block; padding: 12px 20px; background: #0d9488; color: #fff; text-decoration: none; border-radius: 8px;"
          >
            Ver no Fatura+
          </a>
        </p>
        <p style="color: #6b7280; font-size: 12px;">Você recebeu este e-mail porque tem uma fatura em aberto cadastrada no Fatura+.</p>
      </div>
    `,
  });
}
