import { BadRequestError, NotFoundError } from "../lib/app-error.js";
import { extractPdfText } from "../lib/pdf.js";
import { cardRepository } from "../repositories/card.repository.js";
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
    return invoiceRepository.upsertWithItems(cardId, parsed);
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
};
