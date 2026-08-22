import { BadRequestError, NotFoundError } from "../lib/app-error.js";
import { categorize } from "../lib/categorization.js";
import { extractPdfText } from "../lib/pdf.js";
import { cardRepository } from "../repositories/card.repository.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { invoiceRepository } from "../repositories/invoice.repository.js";
import { parseInvoiceText } from "./invoice-parsers/index.js";

async function getOwnedCard(cardId: string, userId: string) {
  const card = await cardRepository.findByIdForUser(cardId, userId);
  if (!card) {
    throw new NotFoundError("Cartão não encontrado");
  }
  return card;
}

// Se o total da fatura já importada mudar mais que isso, pedimos confirmação
// antes de sobrescrever — evita perder uma importação boa por engano.
const SIGNIFICANT_DIFFERENCE_RATIO = 0.15;

function isSignificantlyDifferent(previous: number, incoming: number): boolean {
  if (previous === 0) return incoming !== 0;
  return Math.abs(previous - incoming) / Math.abs(previous) > SIGNIFICANT_DIFFERENCE_RATIO;
}

export const invoiceService = {
  async importFromPdf(cardId: string, userId: string, fileBuffer: Buffer, force = false) {
    await getOwnedCard(cardId, userId);

    let text: string;
    try {
      text = await extractPdfText(fileBuffer);
    } catch {
      throw new BadRequestError("Não foi possível ler o PDF. Verifique se o arquivo não está corrompido.");
    }

    const parsed = parseInvoiceText(text);

    const existing = await invoiceRepository.findByCardAndMonth(cardId, parsed.referenceMonth);
    if (existing && !force && isSignificantlyDifferent(existing.totalAmount, parsed.totalAmount)) {
      const existingWithItems = await invoiceRepository.findByIdForCard(existing.id, cardId);
      return {
        requiresConfirmation: true as const,
        existing: { totalAmount: existing.totalAmount, itemCount: existingWithItems?.items.length ?? 0 },
        incoming: { totalAmount: parsed.totalAmount, itemCount: parsed.items.length },
      };
    }

    const rules = await categoryRepository.findRulesByUser(userId);
    const items = parsed.items.map((item) => ({
      ...item,
      categoryId: categorize(item.description, rules),
    }));

    const invoice = await invoiceRepository.upsertWithItems(cardId, { ...parsed, items });
    return { requiresConfirmation: false as const, invoice };
  },

  async addItem(
    cardId: string,
    invoiceId: string,
    userId: string,
    data: { description: string; amount: number; date: Date; categoryId?: string | null },
  ) {
    await getOwnedCard(cardId, userId);
    const invoice = await invoiceRepository.findByIdForCard(invoiceId, cardId);
    if (!invoice) {
      throw new NotFoundError("Fatura não encontrada");
    }

    if (data.categoryId) {
      const category = await categoryRepository.findByIdForUser(data.categoryId, userId);
      if (!category) {
        throw new NotFoundError("Categoria não encontrada");
      }
    }

    await invoiceRepository.createItem(invoiceId, data);
    await invoiceRepository.adjustTotalAmount(invoiceId, data.amount);

    return invoiceRepository.findByIdForCard(invoiceId, cardId);
  },

  async removeItem(cardId: string, invoiceId: string, itemId: string, userId: string) {
    const item = await invoiceRepository.findItemForUser(itemId, invoiceId, cardId, userId);
    if (!item) {
      throw new NotFoundError("Item não encontrado");
    }

    await invoiceRepository.deleteItem(itemId);
    await invoiceRepository.adjustTotalAmount(invoiceId, -item.amount);

    return invoiceRepository.findByIdForCard(invoiceId, cardId);
  },

  searchItems(userId: string, query: string) {
    return invoiceRepository.searchItemsByUser(userId, query);
  },

  async list(cardId: string, userId: string) {
    await getOwnedCard(cardId, userId);
    return invoiceRepository.findManyByCard(cardId);
  },

  async get(cardId: string, invoiceId: string, userId: string) {
    await getOwnedCard(cardId, userId);
    const invoice = await invoiceRepository.findByIdForCard(invoiceId, cardId);
    if (!invoice) {
      throw new NotFoundError("Fatura não encontrada");
    }
    return invoice;
  },

  async updateItem(
    cardId: string,
    invoiceId: string,
    itemId: string,
    userId: string,
    data: { description?: string; amount?: number; categoryId?: string | null },
  ) {
    const item = await invoiceRepository.findItemForUser(itemId, invoiceId, cardId, userId);
    if (!item) {
      throw new NotFoundError("Item não encontrado");
    }

    if (data.categoryId) {
      const category = await categoryRepository.findByIdForUser(data.categoryId, userId);
      if (!category) {
        throw new NotFoundError("Categoria não encontrada");
      }
    }

    return invoiceRepository.updateItem(itemId, data);
  },

  async updateStatus(cardId: string, invoiceId: string, userId: string, status: "OPEN" | "PAID" | "OVERDUE") {
    await getOwnedCard(cardId, userId);
    const invoice = await invoiceRepository.findByIdForCard(invoiceId, cardId);
    if (!invoice) {
      throw new NotFoundError("Fatura não encontrada");
    }
    return invoiceRepository.updateStatus(invoiceId, status);
  },

  /** Aplica as regras de categorização a todos os itens sem categoria de todas as faturas do cartão. */
  async categorizeAllForCard(cardId: string, userId: string) {
    await getOwnedCard(cardId, userId);
    const invoices = await invoiceRepository.findManyByCard(cardId);
    const rules = await categoryRepository.findRulesByUser(userId);

    let categorizedCount = 0;
    await Promise.all(
      invoices.flatMap((invoice) =>
        invoice.items
          .filter((item) => !item.categoryId)
          .map((item) => {
            const categoryId = categorize(item.description, rules);
            if (!categoryId) return null;
            categorizedCount += 1;
            return invoiceRepository.updateItemCategory(item.id, categoryId);
          }),
      ),
    );

    return { categorizedCount };
  },

  /** Aplica as regras de categorização atuais aos itens que ainda não têm categoria — não sobrescreve escolhas manuais. */
  async categorizeExisting(cardId: string, invoiceId: string, userId: string) {
    await getOwnedCard(cardId, userId);
    const invoice = await invoiceRepository.findByIdForCard(invoiceId, cardId);
    if (!invoice) {
      throw new NotFoundError("Fatura não encontrada");
    }

    const rules = await categoryRepository.findRulesByUser(userId);

    await Promise.all(
      invoice.items
        .filter((item) => !item.categoryId)
        .map((item) => {
          const categoryId = categorize(item.description, rules);
          return categoryId ? invoiceRepository.updateItemCategory(item.id, categoryId) : null;
        }),
    );

    return invoiceRepository.findByIdForCard(invoiceId, cardId);
  },
};
