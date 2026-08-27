import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../lib/prisma.js";
import { overviewService } from "./overview.service.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    invoice: { findMany: vi.fn() },
    invoiceItem: { findMany: vi.fn() },
    card: { findMany: vi.fn() },
  },
}));

function findMonth(months: { month: string; total: number }[], isoPrefix: string) {
  const entry = months.find((m) => m.month.startsWith(isoPrefix));
  if (!entry) throw new Error(`Mês ${isoPrefix} não encontrado`);
  return entry.total;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-15T12:00:00.000Z"));
  vi.mocked(prisma.invoice.findMany).mockResolvedValue([]);
  vi.mocked(prisma.card.findMany).mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("overviewService.get — categoryHistory", () => {
  it("agrupa o gasto por categoria e mês na janela de 6 meses, com zero-fill e ordenado por total desc", async () => {
    vi.mocked(prisma.invoiceItem.findMany)
      .mockResolvedValueOnce([] as never) // currentMonthItems
      .mockResolvedValueOnce([
        {
          amount: 100,
          categoryId: "cat-1",
          category: { name: "Mercado", color: "#111111" },
          invoice: { referenceMonth: new Date("2026-06-10T00:00:00.000Z") },
        },
        {
          amount: 50,
          categoryId: "cat-1",
          category: { name: "Mercado", color: "#111111" },
          invoice: { referenceMonth: new Date("2026-08-05T00:00:00.000Z") },
        },
        {
          amount: 200,
          categoryId: "cat-2",
          category: { name: "Lazer", color: "#222222" },
          invoice: { referenceMonth: new Date("2026-07-01T00:00:00.000Z") },
        },
      ] as never); // rangeItems

    const overview = await overviewService.get("user-1");

    expect(overview.categoryHistory.map((c) => c.categoryId)).toEqual(["cat-2", "cat-1"]);

    const mercado = overview.categoryHistory.find((c) => c.categoryId === "cat-1")!;
    expect(mercado.months).toHaveLength(6);
    expect(findMonth(mercado.months, "2026-06")).toBe(100);
    expect(findMonth(mercado.months, "2026-08")).toBe(50);
    expect(findMonth(mercado.months, "2026-05")).toBe(0);

    const lazer = overview.categoryHistory.find((c) => c.categoryId === "cat-2")!;
    expect(findMonth(lazer.months, "2026-07")).toBe(200);
  });

  it("ignora itens sem categoria", async () => {
    vi.mocked(prisma.invoiceItem.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const overview = await overviewService.get("user-1");

    expect(overview.categoryHistory).toEqual([]);
  });
});

describe("overviewService.get — projection", () => {
  it("projeta os próximos 3 meses somando parcelas cujo restante alcança cada mês", async () => {
    vi.mocked(prisma.invoiceItem.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    vi.mocked(prisma.card.findMany).mockResolvedValue([
      {
        id: "card-1",
        name: "Nubank",
        color: "#820ad1",
        invoices: [
          {
            items: [
              { description: "Notebook", amount: 100, installment: "2/5" }, // restam 3
              { description: "Fone", amount: 50, installment: "5/5" }, // restam 0 — não é commitment
              { description: "Geladeira", amount: 80, installment: "1/2" }, // resta 1
            ],
          },
        ],
      },
    ] as never);

    const overview = await overviewService.get("user-1");

    expect(overview.commitments).toHaveLength(2);
    expect(findMonth(overview.projection, "2026-09")).toBe(180); // A(100)+C(80)
    expect(findMonth(overview.projection, "2026-10")).toBe(100); // só A
    expect(findMonth(overview.projection, "2026-11")).toBe(100); // só A
  });

  it("projeta zero em todos os meses quando não há parcelamento em aberto", async () => {
    vi.mocked(prisma.invoiceItem.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const overview = await overviewService.get("user-1");

    expect(overview.projection.every((p) => p.total === 0)).toBe(true);
  });
});
