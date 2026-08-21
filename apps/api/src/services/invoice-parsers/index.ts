import { BadRequestError } from "../../lib/app-error.js";
import { nubankParser } from "./nubank.parser.js";
import { santanderParser } from "./santander.parser.js";
import type { InvoiceParser, ParsedInvoice } from "./types.js";

// Bancos suportados hoje. Para adicionar um novo, crie um arquivo
// <banco>.parser.ts com a mesma interface InvoiceParser e liste-o aqui.
const parsers: InvoiceParser[] = [nubankParser, santanderParser];

const SUPPORTED_BANKS = parsers.map((p) => p.bank).join(", ");

export function parseInvoiceText(text: string): ParsedInvoice {
  const parser = parsers.find((p) => p.detect(text));
  if (!parser) {
    throw new BadRequestError(
      `Não reconhecemos o banco desta fatura. Bancos suportados no momento: ${SUPPORTED_BANKS}.`,
    );
  }
  return parser.parse(text);
}
