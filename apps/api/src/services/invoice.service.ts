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

export const invoiceService = {
  async importFromPdf(cardId: string, userId: string, fileBuffer: Buffer) {
    await getOwnedCard(cardId, userId);

    let text: string;
    try {
      text = await extractPdfText(fileBuffer);
    } catch {
      throw new BadRequestError("Não foi possível ler o PDF. Verifique se o arquivo não está corrompido.");
    }

    const parsed = parseInvoiceText(text);

    const rules = await categoryRepository.findRulesByUser(userId);
    const items = parsed.items.map((item) => ({
      ...item,
      categoryId: categorize(item.description, rules),
    }));

    return invoiceRepository.upsertWithItems(cardId, { ...parsed, items });
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

  async updateItemCategory(
    cardId: string,
    invoiceId: string,
    itemId: string,
    userId: string,
    categoryId: string | null,
  ) {
    const item = await invoiceRepository.findItemForUser(itemId, invoiceId, cardId, userId);
    if (!item) {
      throw new NotFoundError("Item não encontrado");
    }

    if (categoryId) {
      const category = await categoryRepository.findByIdForUser(categoryId, userId);
      if (!category) {
        throw new NotFoundError("Categoria não encontrada");
      }
    }

    return invoiceRepository.updateItemCategory(itemId, categoryId);
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
