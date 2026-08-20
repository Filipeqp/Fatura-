import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // A CLI (migrate, studio) usa a conexão direta com o Neon —
    // migrations precisam de locks que não funcionam bem via pooler.
    url: env("DIRECT_URL"),
  },
});
