# Fatura+

Organizador de faturas de cartão de crédito. Você faz upload da fatura, o sistema extrai os itens automaticamente, categoriza os gastos por regras de palavra-chave e mostra um dashboard com a evolução dos seus gastos mês a mês.

Projeto pessoal de portfólio, construído para ser usado de verdade — com login/cadastro reais, banco de dados em produção e suporte a múltiplos usuários, cada um vendo apenas os próprios dados.

**Deploy:** em breve.

## Status atual

O projeto está em desenvolvimento ativo. Nesta etapa:

- [x] Tela de autenticação (login, cadastro, recuperação de senha) com identidade visual do Fatura+
- [x] Tema escuro (padrão) e claro, com alternância persistida em `localStorage`
- [x] API (Express + Prisma) conectada a um banco PostgreSQL real (Neon), schema inicial migrado
- [ ] Endpoints de autenticação (JWT)
- [ ] Upload e parsing de fatura em CSV
- [ ] Categorização automática por regras de palavra-chave
- [ ] Dashboard com gráficos de gastos por categoria e comparação mês a mês
- [ ] Deploy em produção (Vercel + Fly.io + Neon)

## Stack

**Frontend** (implementado)
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui (Radix UI + `class-variance-authority`)
- React Hook Form + Zod para validação de formulários
- Framer Motion para as transições entre telas de autenticação
- React Router

**Backend** (esqueleto implementado, endpoints em construção)
- Node.js + TypeScript + Express 5
- Prisma 7 (driver adapter `@prisma/adapter-pg`) + PostgreSQL (Neon)
- JWT (access + refresh token) com bcrypt — planejado
- Zod para validação dos inputs da API
- Vitest para os serviços críticos (parsing e categorização) — planejado

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
          logo.tsx
        lib/
          utils.ts           # helper cn() para classes Tailwind
        App.tsx               # rotas /login e /registrar
        index.css             # tema de cores (CSS variables)
    api/                     # backend Express + Prisma
      prisma/
        schema.prisma         # User, Card, Invoice, InvoiceItem, Category, CategoryRule
        migrations/
      prisma.config.ts         # conexão usada pela CLI do Prisma (migrate, studio)
      src/
        lib/
          prisma.ts            # PrismaClient com driver adapter (pg)
          app-error.ts         # hierarquia de erros de domínio
        middleware/
          error-handler.ts     # tratamento de erro centralizado
        app.ts                  # instância do Express e rotas
        server.ts                # entrypoint
  packages/
    shared/                  # tipos e schemas Zod compartilhados (a implementar)
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

## Decisões técnicas

**Tema via CSS variables, não cores hardcoded.** As cores do Fatura+ (teal como cor primária) são definidas como CSS variables em `src/index.css` e consumidas pelos componentes shadcn através de classes utilitárias (`bg-primary`, `text-muted-foreground`, etc.). Isso mantém os componentes de UI agnósticos de marca — trocar a identidade visual do produto significa editar um arquivo, não caçar cores espalhadas pelo código. O mesmo arquivo já define uma variante `.dark` para um futuro modo escuro.

**Tailwind v4 (CSS-first), sem `tailwind.config.js`.** O tema é declarado inteiramente em CSS via `@theme inline`, o que elimina a duplicação entre arquivo de config e variáveis CSS que existia no Tailwind v3.

**Componentes shadcn vivem em `components/ui/`, não em uma lib externa.** É a convenção padrão do shadcn: os componentes são copiados para dentro do projeto (não instalados como dependência de node_modules), então o time tem controle total sobre o código e pode customizar sem lidar com um pacote de terceiros. O arquivo `components.json` documenta essa convenção para quem for adicionar novos componentes via CLI do shadcn no futuro.

**Backend em camadas (`routes → controllers → services → repositories`).** Ainda não implementado, mas é a decisão já tomada: a lógica de parsing de CSV e a lógica de categorização automática vão viver em services isolados e testáveis por unidade (Vitest), sem depender de banco de dados ou de Express — só assim dá pra testar regra de negócio sem subir infraestrutura.

**Duas connection strings para o Neon: pooled e direta.** `DATABASE_URL` (com `-pooler` no host) é usada em runtime pelo `PrismaClient`, via driver adapter (`@prisma/adapter-pg`) — apropriado para uma API que pode abrir várias conexões simultâneas. `DIRECT_URL` (sem `-pooler`) é usada só pela CLI do Prisma (`prisma migrate`, `prisma studio`), configurada em `prisma.config.ts` — migrations precisam de locks que não funcionam de forma confiável através do pooler.

**Toda rota autenticada valida posse do recurso.** Como o app vai ficar público, com usuários reais e desconhecidos, cada query que busca uma fatura, item ou cartão vai ser amarrada ao `userId` da sessão — nunca um `findUnique` por id isolado — para fechar brechas de IDOR.
