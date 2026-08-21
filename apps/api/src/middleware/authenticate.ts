import type { NextFunction, Request, Response } from "express";

import { UnauthorizedError } from "../lib/app-error.js";
import { verifyAccessToken } from "../lib/jwt.js";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    req.userId = verifyAccessToken(token).sub;
    next();
  } catch {
    throw new UnauthorizedError("Sessão expirada");
  }
}
