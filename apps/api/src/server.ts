import "dotenv/config";

import { app } from "./app.js";
import { scheduleDueDateReminders } from "./jobs/due-date-reminder.js";

const port = Number(process.env.PORT ?? 3333);

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});

scheduleDueDateReminders();
