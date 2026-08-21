import { Router } from "express";

import { getInvoice, listInvoices, uploadInvoice } from "../controllers/invoice.controller.js";
import { upload } from "../middleware/upload.js";

export const invoiceRoutes = Router({ mergeParams: true });

invoiceRoutes.get("/", listInvoices);
invoiceRoutes.post("/", upload.single("file"), uploadInvoice);
invoiceRoutes.get("/:invoiceId", getInvoice);
