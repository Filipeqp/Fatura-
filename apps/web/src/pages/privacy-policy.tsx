import { Link } from "react-router-dom";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen w-full bg-muted/30">
      <header className="border-b border-border/50 bg-card/50 p-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/login">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 py-10 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Política de Privacidade</h1>
          <p className="mt-1 text-sm text-muted-foreground">Última atualização: setembro de 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-foreground">
          <p>
            O Fatura+ é um projeto pessoal de portfólio para organização de faturas de cartão de crédito. Esta
            página explica quais dados coletamos, para que usamos e como você pode removê-los.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Quais dados coletamos</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Nome e e-mail, informados no cadastro ou obtidos do Google quando você entra com essa opção.</li>
              <li>Senha, armazenada apenas como hash — nunca em texto puro.</li>
              <li>
                Dados das faturas que você envia: cartões cadastrados, itens extraídos dos PDFs, categorias e regras
                de categorização.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Para que usamos</h2>
            <p className="text-muted-foreground">
              Exclusivamente para operar o app: autenticar sua conta, organizar e categorizar seus gastos, mostrar
              seu dashboard, e enviar e-mails transacionais (redefinição de senha, aviso de vencimento de fatura,
              alerta de orçamento). Não usamos seus dados para publicidade e não os vendemos ou compartilhamos com
              terceiros para fins de marketing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Serviços de terceiros envolvidos</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Google</strong> — apenas se você optar por "Continuar com
                Google", para autenticação.
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> — envio dos e-mails transacionais mencionados
                acima.
              </li>
              <li>
                <strong className="text-foreground">Neon, Vercel e Railway</strong> — hospedagem do banco de dados e
                da aplicação.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Seus dados, seu controle</h2>
            <p className="text-muted-foreground">
              Cada conta só tem acesso aos próprios dados. Você pode editar seu perfil, trocar sua senha ou excluir
              sua conta permanentemente a qualquer momento, na tela de Conta dentro do app — a exclusão remove seus
              cartões, faturas e categorias do banco de dados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-medium text-foreground">Contato</h2>
            <p className="text-muted-foreground">
              Dúvidas sobre esta política? Escreva para{" "}
              <a className="text-primary hover:underline" href="mailto:quaresmafilipe07@gmail.com">
                quaresmafilipe07@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
