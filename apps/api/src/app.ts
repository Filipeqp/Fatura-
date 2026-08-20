import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/error-handler.js";
import { prisma } from "./lib/prisma.js";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "connected" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use(errorHandler);
