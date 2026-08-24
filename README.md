# Fatura+

Organizador de faturas de cartão de crédito. Você faz upload da fatura, o sistema extrai os itens automaticamente, categoriza os gastos por regras de palavra-chave e mostra um dashboard com a evolução dos seus gastos mês a mês.

Projeto pessoal de portfólio, construído para ser usado de verdade — com login/cadastro reais, banco de dados em produção e suporte a múltiplos usuários, cada um vendo apenas os próprios dados.

**Deploy:** em breve.

## Status atual

O fluxo essencial (login → upload de fatura → categorização → dashboard) já está implementado de ponta a ponta:

- [x] Autenticação completa: registro, login, login com Google, refresh token, logout, recuperação de senha por e-mail, troca de senha, editar/excluir conta — com rate limiting nas rotas sensíveis
- [x] Tema escuro (padrão) e claro, com alternância persistida em `localStorage`
- [x] CRUD de cartões
- [x] Upload de fatura em PDF, com parsing automático (Nubank e Santander) e importação dos itens
- [x] Categorização automática por regras de palavra-chave, com categorias padrão sugeridas
- [x] Busca de itens entre faturas
- [x] Dashboard com visão geral consolidada dos gastos
- [x] Job agendado (cron) para aviso de vencimento de fatura
- [x] Testes unitários da regra de categorização, dos parsers de fatura (Nubank e Santander) e dos services de autenticação e fatura (Vitest)
- [ ] Testes da camada de repositório/integração com o banco
- [ ] Suporte a mais bancos além de Nubank/Santander
- [ ] Deploy em produção (Vercel + Fly.io + Neon)

## Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui (Radix UI + `class-variance-authority`)
- React Hook Form + Zod para validação de formulários
- Framer Motion para as transições entre telas de autenticação
- React Router

**Backend**
- Node.js + TypeScript + Express 5
- Prisma 7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL (Neon)
- JWT (access + refresh token) com bcrypt, login OAuth com Google
- Zod para validação dos inputs da API
- Resend para e-mails transacionais (recuperação de senha, aviso de vencimento)
- node-cron para o job de aviso de vencimento
- Vitest para os serviços críticos: categorização, parsing de fatura e services de auth/fatura (mockando repositórios e libs externas)

**Infraestrutura** (planejado)
- Frontend na Vercel
- Backend no Fly.io
- Banco de dados gerenciado no Neon

## Estrutura de pastas

```
fatura-plus/
  apps/
    web/                    # frontend React + Vite
      src/
        components/
          ui/                # componentes shadcn (button, input, auth-form-1, ...)
          account/ cards/ categories/ invoices/ overview/
        pages/               # dashboard, card-detail, invoice-detail, categories, search, overview, account...
        lib/
          auth-context.tsx    # estado de sessão (access token)
          utils.ts            # helper cn() para classes Tailwind
        App.tsx               # rotas da aplicação
        index.css             # tema de cores (CSS variables)
    api/                     # backend Express + Prisma
      prisma/
        schema.prisma         # User, Card, Invoice, InvoiceItem, Category, CategoryRule, RefreshToken...
        migrations/
      prisma.config.ts         # conexão usada pela CLI do Prisma (migrate, studio)
      src/
        routes/ controllers/ services/ repositories/   # backend em camadas
        jobs/
          due-date-reminder.ts # cron de aviso de vencimento
        lib/
          prisma.ts            # PrismaClient com driver adapter (pg)
          pdf.ts                # extração de texto do PDF da fatura
          categorization.ts     # regra de categorização por palavra-chave
          app-error.ts         # hierarquia de erros de domínio
        middleware/
          authenticate.ts      # valida JWT e injeta userId no request
          error-handler.ts     # tratamento de erro centralizado
        app.ts                  # instância do Express e rotas
        server.ts                # entrypoint
  packages/
    shared/                  # tipos e schemas Zod compartilhados (a implementar)
  iniciar-app.bat            # sobe API + frontend juntos (Windows)
```

## Como rodar localmente

Pré-requisitos: Node.js 20+ e um banco PostgreSQL (recomendado: um projeto gratuito no [Neon](https://neon.tech)).

```bash
npm install
```

**Frontend:**
```bash
npm run dev
```
Sobe em `http://localhost:5173`. As rotas `/login` e `/registrar` já estão disponíveis.

**Backend:**
```bash
cp apps/api/.env.example apps/api/.env
# preencha DATABASE_URL (pooled) e DIRECT_URL (direta) com a connection string do seu banco
npm run -w apps/api prisma:migrate
npm run dev:api
```
Sobe em `http://localhost:3333`. `GET /health` confirma que a API subiu e conseguiu conectar no banco.

**Os dois juntos:**
```bash
npm run dev:all
```
Sobe API e frontend no mesmo terminal (logs prefixados `[API]`/`[WEB]`). No Windows, dê duplo clique em `iniciar-app.bat` pra fazer o mesmo sem abrir terminal.

## Decisões técnicas

**Tema via CSS variables, não cores hardcoded.** As cores do Fatura+ (teal como cor primária) são definidas como CSS variables em `src/index.css` e consumidas pelos componentes shadcn através de classes utilitárias (`bg-primary`, `text-muted-foreground`, etc.). Isso mantém os componentes de UI agnósticos de marca — trocar a identidade visual do produto significa editar um arquivo, não caçar cores espalhadas pelo código. O mesmo arquivo já define uma variante `.dark` para um futuro modo escuro.

**Tailwind v4 (CSS-first), sem `tailwind.config.js`.** O tema é declarado inteiramente em CSS via `@theme inline`, o que elimina a duplicação entre arquivo de config e variáveis CSS que existia no Tailwind v3.

**Componentes shadcn vivem em `components/ui/`, não em uma lib externa.** É a convenção padrão do shadcn: os componentes são copiados para dentro do projeto (não instalados como dependência de node_modules), então o time tem controle total sobre o código e pode customizar sem lidar com um pacote de terceiros. O arquivo `components.json` documenta essa convenção para quem for adicionar novos componentes via CLI do shadcn no futuro.

**Backend em camadas (`routes → controllers → services → repositories`).** A lógica de parsing de PDF e a lógica de categorização automática vivem em services isolados e testáveis por unidade (Vitest), sem depender de banco de dados ou de Express — só assim dá pra testar regra de negócio sem subir infraestrutura. Hoje categorização, os parsers de fatura e os services de auth/fatura têm teste (mockando repositório e libs externas como bcrypt/e-mail/Google); falta cobertura na camada de repositório.

**Duas connection strings para o Neon: pooled e direta.** `DATABASE_URL` (com `-pooler` no host) é usada em runtime pelo `PrismaClient`, via driver adapter (`@prisma/adapter-pg`) — apropriado para uma API que pode abrir várias conexões simultâneas. `DIRECT_URL` (sem `-pooler`) é usada só pela CLI do Prisma (`prisma migrate`, `prisma studio`), configurada em `prisma.config.ts` — migrations precisam de locks que não funcionam de forma confiável através do pooler.

**Toda rota autenticada valida posse do recurso.** Como o app é público, com usuários reais e desconhecidos, cada query que busca uma fatura, item ou cartão é amarrada ao `userId` da sessão — nunca um `findUnique` por id isolado — pra fechar brechas de IDOR.
