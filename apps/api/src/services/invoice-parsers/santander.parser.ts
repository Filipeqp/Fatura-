import { BadRequestError } from "../../lib/app-error.js";
import type { InvoiceParser, ParsedInvoice, ParsedInvoiceItem } from "./types.js";

const DUE_DATE_REGEX = /Vencimento\s*[\r\n]+\s*(\d{2})\/(\d{2})\/(\d{4})/i;
const TOTAL_REGEX = /Total a Pagar\s*[\r\n]+\s*R\$\s*([\d.,]+)/i;

// Linha de parcelamento: "10/01 MLP*KABUM MAGAZIN 07/10 296,84" (às vezes com um
// caractere de ícone solto antes da data, ex: "1 14/04 CMSIABUFFET 04/04 492,12").
const ITEM_REGEX = /^(?:\S+\s+)?(\d{2})\/(\d{2})\s+(.+?)\s+(\d{2})\/(\d{2})\s+([\d.,]+)$/;

function parseAmountBR(raw: string): number {
  return Number(raw.trim().replace(/\./g, "").replace(",", "."));
}

/**
 * A coluna de data no Santander é a data da COMPRA original (pode ser de meses
 * atrás, para parcelamentos antigos), não a data de cobrança nesta fatura.
 * Resolve o ano assumindo a compra mais recente possível antes do mês de referência.
 */
function resolveYear(itemMonth: number, referenceMonth: Date): number {
  const refYear = referenceMonth.getUTCFullYear();
  const refMonth = referenceMonth.getUTCMonth();
  return itemMonth > refMonth + 1 ? refYear - 1 : refYear;
}

function parse(text: string): ParsedInvoice {
  const dueMatch = text.match(DUE_DATE_REGEX);
  if (!dueMatch) {
    throw new BadRequestError("Não foi possível localizar a data de vencimento na fatura Santander");
  }
  const [, dueDay, dueMonth, dueYear] = dueMatch;
  const dueDate = new Date(Date.UTC(Number(dueYear), Number(dueMonth) - 1, Number(dueDay)));

  const totalMatch = text.match(TOTAL_REGEX);
  if (!totalMatch) {
    throw new BadRequestError("Não foi possível localizar o valor total na fatura Santander");
  }
  const totalAmount = parseAmountBR(totalMatch[1]);

  const referenceMonth = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), 1));

  const startIdx = text.indexOf("Parcelamentos");
  const endIdx = startIdx >= 0 ? text.indexOf("VALOR TOTAL", startIdx) : -1;
  const block = startIdx >= 0 && endIdx > startIdx ? text.slice(startIdx, endIdx) : "";

  const items: ParsedInvoiceItem[] = [];
  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("Parcelamentos") || line.startsWith("Compra")) continue;

    const match = line.match(ITEM_REGEX);
    if (!match) continue;

    const [, day, month, description, instCurrent, instTotal, amountRaw] = match;
    const monthIndex = Number(month) - 1;

    items.push({
      description: description.trim(),
      amount: parseAmountBR(amountRaw),
      date: new Date(Date.UTC(resolveYear(monthIndex, referenceMonth), monthIndex, Number(day))),
      installment: `${instCurrent}/${instTotal}`,
    });
  }

  return { bank: "Santander", referenceMonth, dueDate, totalAmount, items };
}

export const santanderParser: InvoiceParser = {
  bank: "Santander",
  detect: (text) => /Santander/i.test(text),
  parse,
};
