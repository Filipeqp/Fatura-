import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendBudgetAlertEmail } from "../lib/mailer.js";
import { prisma } from "../lib/prisma.js";
import { checkBudgetAlerts } from "./budget-alert.js";

vi.mock("../lib/mailer.js", () => ({
  sendBudgetAlertEmail: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    category: { findMany: vi.fn() },
    invoiceItem: { groupBy: vi.fn() },
    categoryBudgetAlert: { findMany: vi.fn(), create: vi.fn() },
  },
}));

function makeCategory(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "cat-1",
    name: "Mercado",
    monthlyBudget: 500,
    user: { id: "user-1", name: "Filipe", email: "filipe@example.com" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.categoryBudgetAlert.findMany).mockResolvedValue([]);
});

describe("checkBudgetAlerts", () => {
  it("ignora categorias sem gasto suficiente pra atingir 80% do orçamento", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([makeCategory()] as never);
    vi.mocked(prisma.invoiceItem.groupBy).mockResolvedValue([{ categoryId: "cat-1", _sum: { amount: 100 } }] as never);

    const result = await checkBudgetAlerts();

    expect(result.sent).toBe(0);
    expect(sendBudgetAlertEmail).not.toHaveBeenCalled();
    expect(prisma.categoryBudgetAlert.create).not.toHaveBeenCalled();
  });

  it("envia alerta NEAR quando o gasto atinge 80% do orçamento e registra o envio", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([makeCategory()] as never);
    vi.mocked(prisma.invoiceItem.groupBy).mockResolvedValue([{ categoryId: "cat-1", _sum: { amount: 400 } }] as never);

    const result = await checkBudgetAlerts();

    expect(result.sent).toBe(1);
    expect(sendBudgetAlertEmail).toHaveBeenCalledWith("filipe@example.com", "Filipe", "Mercado", 400, 500, "NEAR");
    expect(prisma.categoryBudgetAlert.create).toHaveBeenCalledWith({
      data: { categoryId: "cat-1", month: expect.any(Date), level: "NEAR" },
    });
  });

  it("envia alerta OVER mesmo quando o NEAR já foi enviado este mês", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([makeCategory()] as never);
    vi.mocked(prisma.invoiceItem.groupBy).mockResolvedValue([{ categoryId: "cat-1", _sum: { amount: 600 } }] as never);
    vi.mocked(prisma.categoryBudgetAlert.findMany).mockResolvedValue([
      { categoryId: "cat-1", level: "NEAR" } as never,
    ]);

    const result = await checkBudgetAlerts();

    expect(result.sent).toBe(1);
    expect(sendBudgetAlertEmail).toHaveBeenCalledWith("filipe@example.com", "Filipe", "Mercado", 600, 500, "OVER");
  });

  it("não reenvia um alerta cujo nível já foi registrado este mês", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([makeCategory()] as never);
    vi.mocked(prisma.invoiceItem.groupBy).mockResolvedValue([{ categoryId: "cat-1", _sum: { amount: 600 } }] as never);
    vi.mocked(prisma.categoryBudgetAlert.findMany).mockResolvedValue([
      { categoryId: "cat-1", level: "OVER" } as never,
    ]);

    const result = await checkBudgetAlerts();

    expect(result.sent).toBe(0);
    expect(sendBudgetAlertEmail).not.toHaveBeenCalled();
  });

  it("não consulta gastos quando nenhuma categoria tem orçamento definido", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([]);

    const result = await checkBudgetAlerts();

    expect(result.sent).toBe(0);
    expect(prisma.invoiceItem.groupBy).not.toHaveBeenCalled();
  });
});
