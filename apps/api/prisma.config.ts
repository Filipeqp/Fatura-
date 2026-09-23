import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // A CLI (migrate, studio) usa a conexão direta com o Neon — migrations precisam de locks
    // que não funcionam bem via pooler. `process.env` (em vez do helper `env()`) porque
    // `prisma generate` roda no build da imagem Docker, antes de qualquer variável de ambiente
    // de runtime existir, e generate não precisa de conexão real — só do schema.
    url: process.env.DIRECT_URL ?? "",
  },
});
