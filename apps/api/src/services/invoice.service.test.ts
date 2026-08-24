import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, NotFoundError } from "../lib/app-error.js";
import { categorize } from "../lib/categorization.js";
import { extractPdfText } from "../lib/pdf.js";
import { cardRepository } from "../repositories/card.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { invoiceRepository } from "../repositories/invoice.repository.js";
import { parseInvoiceText } from "./invoice-parsers/index.js";
import { invoiceService } from "./invoice.service.js";

vi.mock("../lib/pdf.js", () => ({
  extractPdfText: vi.fn(),
}));

vi.mock("../lib/categorization.js", () => ({
  categorize: vi.fn(),
}));

vi.mock("./invoice-parsers/index.js", () => ({
  parseInvoiceText: vi.fn(),
}));

vi.mock("../repositories/card.repository.js", () => ({
  cardRepository: {
    findByIdForUser: vi.fn(),
  },
}));

vi.mock("../repositories/category.repository.js", () => ({
  categoryRepository: {
    findRulesByUser: vi.fn(),
    findByIdForUser: vi.fn(),
  },
}));

vi.mock("../repositories/invoice.repository.js", () => ({
  invoiceRepository: {
    findByCardAndMonth: vi.fn(),
    findByIdForCard: vi.fn(),
    findManyByCard: vi.fn(),
    findItemForUser: vi.fn(),
    upsertWithItems: vi.fn(),
    createItem: vi.fn(),
    deleteItem: vi.fn(),
    adjustTotalAmount: vi.fn(),
    updateItem: vi.fn(),
    updateStatus: vi.fn(),
    updateItemCategory: vi.fn(),
  },
}));

const CARD = { id: "card-1", userId: "user-1", name: "Nubank" };
const PARSED = {
  bank: "Nubank",
  referenceMonth: new Date(Date.UTC(2026, 7, 1)),
  dueDate: new Date(Date.UTC(2026, 7, 10)),
  totalAmount: 100,
  items: [{ description: "Uber", amount: 100, date: new Date(), installment: null }],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(cardRepository.findByIdForUser).mockResolvedValue(CARD as never);
  vi.mocked(categoryRepository.findRulesByUser).mockResolvedValue([]);
  vi.mocked(extractPdfText).mockResolvedValue("texto do pdf");
  vi.mocked(parseInvoiceText).mockReturnValue(PARSED as never);
  vi.mocked(categorize).mockReturnValue(null);
});

describe("invoiceService.importFromPdf", () => {
  it("lança NotFoundError quando o cartão não pertence ao usuário", async () => {
    vi.mocked(cardRepository.findByIdForUser).mockResolvedValue(null);

    await expect(invoiceService.importFromPdf("card-1", "user-1", Buffer.from(""))).rejects.toThrow(
      NotFoundError,
    );
    expect(extractPdfText).not.toHaveBeenCalled();
  });

  it("lança BadRequestError quando o PDF não pode ser lido", async () => {
    vi.mocked(extractPdfText).mockRejectedValue(new Error("corrupted"));

    await expect(invoiceService.importFromPdf("card-1", "user-1", Buffer.from(""))).rejects.toThrow(
      BadRequestError,
    );
  });

  it("categoriza os itens extraídos com as regras do usuário e importa quando não há fatura anterior", async () => {
    vi.mocked(invoiceRepository.findByCardAndMonth).mockResolvedValue(null);
    vi.mocked(categorize).mockReturnValue("cat-transporte");
    vi.mocked(invoiceRepository.upsertWithItems).mockResolvedValue({ id: "inv-1" } as never);

    const result = await invoiceService.importFromPdf("card-1", "user-1", Buffer.from(""));

    expect(result).toEqual({ requiresConfirmation: false, invoice: { id: "inv-1" } });
    expect(invoiceRepository.upsertWithItems).toHaveBeenCalledWith(
      "card-1",
      expect.objectContaining({
        items: [expect.objectContaining({ description: "Uber", categoryId: "cat-transporte" })],
      }),
    );
  });

  it("pede confirmação quando já existe fatura no mês com total muito diferente e não foi forçado", async () => {
    vi.mocked(invoiceRepository.findByCardAndMonth).mockResolvedValue({
      id: "inv-old",
      totalAmount: 100,
    } as never);
    vi.mocked(invoiceRepository.findByIdForCard).mockResolvedValue({
      id: "inv-old",
      items: [{ id: "item-1" }],
    } as never);
    vi.mocked(parseInvoiceText).mockReturnValue({ ...PARSED, totalAmount: 300 } as never);

    const result = await invoiceService.importFromPdf("card-1", "user-1", Buffer.from(""));

    expect(result).toEqual({
      requiresConfirmation: true,
      existing: { totalAmount: 100, itemCount: 1 },
      incoming: { totalAmount: 300, itemCount: 1 },
    });
    expect(invoiceRepository.upsertWithItems).not.toHaveBeenCalled();
  });

  it.each([
    [100, 110, false], // 10% de diferença: dentro da tolerância
    [100, 120, true], // 20% de diferença: excede a tolerância de 15%
  ])("diferença de %d para %d exige confirmação = %s", async (previous, incoming, expectConfirmation) => {
    vi.mocked(invoiceRepository.findByCardAndMonth).mockResolvedValue({
      id: "inv-old",
      totalAmount: previous,
    } as never);
    vi.mocked(invoiceRepository.findByIdForCard).mockResolvedValue({ id: "inv-old", items: [] } as never);
    vi.mocked(parseInvoiceText).mockReturnValue({ ...PARSED, totalAmount: incoming } as never);
    vi.mocked(invoiceRepository.upsertWithItems).mockResolvedValue({ id: "inv-1" } as never);

    const result = await invoiceService.importFromPdf("card-1", "user-1", Buffer.from(""));

    expect(result.requiresConfirmation).toBe(expectConfirmation);
  });

  it("ignora a diferença de total e reimporta quando force=true", async () => {
    vi.mocked(invoiceRepository.findByCardAndMonth).mockResolvedValue({
      id: "inv-old",
      totalAmount: 100,
    } as never);
    vi.mocked(parseInvoiceText).mockReturnValue({ ...PARSED, totalAmount: 500 } as never);
    vi.mocked(invoiceRepository.upsertWithItems).mockResolvedValue({ id: "inv-1" } as never);

    const result = await invoiceService.importFromPdf("card-1", "user-1", Buffer.from(""), true);

    expect(result.requiresConfirmation).toBe(false);
    expect(invoiceRepository.upsertWithItems).toHaveBeenCalled();
  });
});

describe("invoiceService.addItem", () => {
  const data = { description: "Farmácia", amount: 50, date: new Date() };

  it("lança NotFoundError quando o cartão não pertence ao usuário", async () => {
    vi.mocked(cardRepository.findByIdForUser).mockResolvedValue(null);

    await expect(invoiceService.addItem("card-1", "inv-1", "user-1", data)).rejects.toThrow(NotFoundError);
  });

  it("lança NotFoundError quando a fatura não existe no cartão", async () => {
    vi.mocked(invoiceRepository.findByIdForCard).mockResolvedValue(null);

    await expect(invoiceService.addItem("card-1", "inv-1", "user-1", data)).rejects.toThrow(NotFoundError);
  });

  it("lança NotFoundError quando a categoria informada não pertence ao usuário", async () => {
    vi.mocked(invoiceRepository.findByIdForCard).mockResolvedValue({ id: "inv-1" } as never);
    vi.mocked(categoryRepository.findByIdForUser).mockResolvedValue(null);

    await expect(
      invoiceService.addItem("card-1", "inv-1", "user-1", { ...data, categoryId: "cat-x" }),
    ).rejects.toThrow(NotFoundError);
    expect(invoiceRepository.createItem).not.toHaveBeenCalled();
  });

  it("cria o item e ajusta o total da fatura", async () => {
    vi.mocked(invoiceRepository.findByIdForCard).mockResolvedValue({ id: "inv-1" } as never);

    await invoiceService.addItem("card-1", "inv-1", "user-1", data);

    expect(invoiceRepository.createItem).toHaveBeenCalledWith("inv-1", data);
    expect(invoiceRepository.adjustTotalAmount).toHaveBeenCalledWith("inv-1", 50);
  });
});

describe("invoiceService.removeItem", () => {
  it("lança NotFoundError quando o item não pertence ao usuário/fatura/cartão", async () => {
    vi.mocked(invoiceRepository.findItemForUser).mockResolvedValue(null);

    await expect(invoiceService.removeItem("card-1", "inv-1", "item-1", "user-1")).rejects.toThrow(
      NotFoundError,
    );
    expect(invoiceRepository.deleteItem).not.toHaveBeenCalled();
  });

  it("remove o item e desconta o valor do total da fatura", async () => {
    vi.mocked(invoiceRepository.findItemForUser).mockResolvedValue({ id: "item-1", amount: 30 } as never);

    await invoiceService.removeItem("card-1", "inv-1", "item-1", "user-1");

    expect(invoiceRepository.deleteItem).toHaveBeenCalledWith("item-1");
    expect(invoiceRepository.adjustTotalAmount).toHaveBeenCalledWith("inv-1", -30);
  });
});

describe("invoiceService.categorizeAllForCard", () => {
  it("categoriza só os itens sem categoria e conta quantos foram categorizados", async () => {
    vi.mocked(invoiceRepository.findManyByCard).mockResolvedValue([
      {
        id: "inv-1",
        items: [
          { id: "item-1", description: "Uber", categoryId: null },
          { id: "item-2", description: "Já categorizado", categoryId: "cat-existente" },
          { id: "item-3", description: "Sem regra", categoryId: null },
        ],
      },
    ] as never);
    vi.mocked(categorize).mockImplementation((description) =>
      description === "Uber" ? "cat-transporte" : null,
    );

    const result = await invoiceService.categorizeAllForCard("card-1", "user-1");

    expect(result).toEqual({ categorizedCount: 1 });
    expect(invoiceRepository.updateItemCategory).toHaveBeenCalledTimes(1);
    expect(invoiceRepository.updateItemCategory).toHaveBeenCalledWith("item-1", "cat-transporte");
  });
});

describe("invoiceService.categorizeExisting", () => {
  it("lança NotFoundError quando a fatura não existe", async () => {
    vi.mocked(invoiceRepository.findByIdForCard).mockResolvedValue(null);

    await expect(invoiceService.categorizeExisting("card-1", "inv-1", "user-1")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("não sobrescreve a categoria de um item já categorizado manualmente", async () => {
    vi.mocked(invoiceRepository.findByIdForCard).mockResolvedValue({
      id: "inv-1",
      items: [{ id: "item-1", description: "Uber", categoryId: "cat-manual" }],
    } as never);

    await invoiceService.categorizeExisting("card-1", "inv-1", "user-1");

    expect(invoiceRepository.updateItemCategory).not.toHaveBeenCalled();
  });
});
