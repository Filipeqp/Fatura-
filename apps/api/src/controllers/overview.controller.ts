import type { Request, Response } from "express";

import { overviewService } from "../services/overview.service.js";

export async function getOverview(req: Request, res: Response) {
  const overview = await overviewService.get(req.userId!);
  res.json(overview);
}
