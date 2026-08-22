import { Router } from "express";

import {
  addItem,
  categorizeInvoice,
  deleteItem,
  getInvoice,
  listInvoices,
  updateInvoice,
  updateItem,
  uploadInvoice,
} from "../controllers/invoice.controller.js";
import { upload } from "../middleware/upload.js";

export const invoiceRoutes = Router({ mergeParams: true });

invoiceRoutes.get("/", listInvoices);
invoiceRoutes.post("/", upload.single("file"), uploadInvoice);
invoiceRoutes.get("/:invoiceId", getInvoice);
invoiceRoutes.patch("/:invoiceId", updateInvoice);
invoiceRoutes.post("/:invoiceId/categorize", categorizeInvoice);
invoiceRoutes.post("/:invoiceId/items", addItem);
invoiceRoutes.patch("/:invoiceId/items/:itemId", updateItem);
invoiceRoutes.delete("/:invoiceId/items/:itemId", deleteItem);
