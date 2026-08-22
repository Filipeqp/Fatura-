import { Router } from "express";

import { createCard, deleteCard, getCard, listCards, updateCard } from "../controllers/card.controller.js";
import { categorizeCard } from "../controllers/invoice.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { invoiceRoutes } from "./invoice.routes.js";

export const cardRoutes = Router();

cardRoutes.use(authenticate);

cardRoutes.get("/", listCards);
cardRoutes.post("/", createCard);
cardRoutes.get("/:id", getCard);
cardRoutes.patch("/:id", updateCard);
cardRoutes.delete("/:id", deleteCard);
cardRoutes.post("/:id/categorize", categorizeCard);

cardRoutes.use("/:cardId/invoices", invoiceRoutes);
