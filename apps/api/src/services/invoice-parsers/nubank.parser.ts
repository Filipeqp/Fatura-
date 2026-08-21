import { BadRequestError } from "../../lib/app-error.js";
import type { InvoiceParser, ParsedInvoice, ParsedInvoiceItem } from "./types.js";

const MONTHS: Record<string, number> = {
  JAN: 0,
  FEV: 1,
  MAR: 2,
  ABR: 3,
  MAI: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SET: 8,
  OUT: 9,
  NOV: 10,
  DEZ: 11,
};

const DUE_DATE_REGEX = /Data de vencimento:\s*(\d{2})\s*([A-ZÇ]{3})\s*(\d{4})/i;
const TOTAL_REGEX = /Total a pagar\s+R\$\s*([\d.,]+)/i;

// Linha de transação: "16 JUL •••• 8405 Amazon - Parcela 2/3 R$ 79,08"
// A exigência de "••••" filtra naturalmente pagamentos e outras linhas sem cartão associado.
const ITEM_REGEX =
  /^(\d{2})\s+([A-ZÇ]{3})\s+••••\s+\d{4}\s+(.+?)(?:\s+-\s+Parcela\s+(\d+)\/(\d+))?\s+R\$\s*([\d.,]+)$/i;

function parseAmountBR(raw: string): number {
  return Number(raw.trim().replace(/\./g, "").replace(",", "."));
}

/** Faturas que cruzam a virada do ano (ex: vencimento em janeiro, compra em dezembro). */
function resolveYear(itemMonth: number, dueDate: Date): number {
  const dueYear = dueDate.getUTCFullYear();
  const dueMonth = dueDate.getUTCMonth();
  return itemMonth > dueMonth + 1 ? dueYear - 1 : dueYear;
}

function parse(text: string): ParsedInvoice {
  const dueMatch = text.match(DUE_DATE_REGEX);
  if (!dueMatch) {
    throw new BadRequestError("Não foi possível localizar a data de vencimento na fatura Nubank");
  }
  const [, dueDay, dueMonthAbbr, dueYearStr] = dueMatch;
  const dueMonthIndex = MONTHS[dueMonthAbbr.toUpperCase()];
  const dueDate = new Date(Date.UTC(Number(dueYearStr), dueMonthIndex, Number(dueDay)));

  const totalMatch = text.match(TOTAL_REGEX);
  if (!totalMatch) {
    throw new BadRequestError("Não foi possível localizar o valor total na fatura Nubank");
  }
  const totalAmount = parseAmountBR(totalMatch[1]);

  const items: ParsedInvoiceItem[] = [];
  for (const line of text.split("\n")) {
    const match = line.trim().match(ITEM_REGEX);
    if (!match) continue;

    const [, day, monthAbbr, description, installmentCurrent, installmentTotal, amountRaw] = match;
    const monthIndex = MONTHS[monthAbbr.toUpperCase()];
    if (monthIndex === undefined) continue;

    items.push({
      description: description.trim(),
      amount: parseAmountBR(amountRaw),
      date: new Date(Date.UTC(resolveYear(monthIndex, dueDate), monthIndex, Number(day))),
      installment: installmentCurrent ? `${installmentCurrent}/${installmentTotal}` : null,
    });
  }

  const referenceMonth = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), 1));

  return { bank: "Nubank", referenceMonth, dueDate, totalAmount, items };
}

export const nubankParser: InvoiceParser = {
  bank: "Nubank",
  detect: (text) => /Nu Pagamentos S\.A\./i.test(text),
  parse,
};
