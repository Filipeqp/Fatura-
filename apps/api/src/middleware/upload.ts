import multer from "multer";

import { BadRequestError } from "../lib/app-error.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new BadRequestError("Envie um arquivo PDF"));
      return;
    }
    cb(null, true);
  },
});
