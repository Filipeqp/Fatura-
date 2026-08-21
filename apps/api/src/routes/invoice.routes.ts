import { Router } from "express";

import {
  categorizeInvoice,
  getInvoice,
  listInvoices,
  updateItemCategory,
  uploadInvoice,
} from "../controllers/invoice.controller.js";
import { upload } from "../middleware/upload.js";

export const invoiceRoutes = Router({ mergeParams: true });

invoiceRoutes.get("/", listInvoices);
invoiceRoutes.post("/", upload.single("file"), uploadInvoice);
invoiceRoutes.get("/:invoiceId", getInvoice);
invoiceRoutes.post("/:invoiceId/categorize", categorizeInvoice);
invoiceRoutes.patch("/:invoiceId/items/:itemId", updateItemCategory);
