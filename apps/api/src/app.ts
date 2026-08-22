import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/error-handler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { cardRoutes } from "./routes/card.routes.js";
import { categoryRoutes } from "./routes/category.routes.js";
import { itemRoutes } from "./routes/item.routes.js";
import { jobRoutes } from "./routes/job.routes.js";
import { overviewRoutes } from "./routes/overview.routes.js";
import { prisma } from "./lib/prisma.js";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "connected" });
});

app.use("/auth", authRoutes);
app.use("/cards", cardRoutes);
app.use("/categories", categoryRoutes);
app.use("/items", itemRoutes);
app.use("/jobs", jobRoutes);
app.use("/overview", overviewRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use(errorHandler);
