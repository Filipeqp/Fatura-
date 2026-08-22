import type { Request, Response } from "express";

import { checkUpcomingDueDates } from "../jobs/due-date-reminder.js";

/**
 * Disparo manual, útil pra testar sem esperar o cron diário. Protegido por
 * autenticação apenas pra não ficar público — num app multiusuário de verdade,
 * isso seria uma rota de sistema, não algo que qualquer usuário logado aciona.
 */
export async function runDueDateCheck(_req: Request, res: Response) {
  const result = await checkUpcomingDueDates();
  res.json(result);
}
