import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Fatura+ <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.CORS_ORIGIN}/redefinir-senha?token=${resetToken}`;

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
