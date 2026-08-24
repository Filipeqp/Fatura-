import { describe, expect, it } from "vitest";

import { BadRequestError } from "../../lib/app-error.js";
import { parseInvoiceText } from "./index.js";

const NUBANK_SAMPLE = `
Nu Pagamentos S.A.
Data de vencimento: 10 AGO 2026
16 JUL •••• 8405 Uber R$ 23,50
Total a pagar R$ 23,50
`;

const SANTANDER_SAMPLE = `
Santander Cartões
Vencimento
10/02/2026
Parcelamentos
10/01 UBER 01/01 23,50
VALOR TOTAL
Total a Pagar
R$ 23,50
`;

describe("parseInvoiceText", () => {
  it("escolhe o parser Nubank quando o texto é de uma fatura Nubank", () => {
    const result = parseInvoiceText(NUBANK_SAMPLE);
    expect(result.bank).toBe("Nubank");
  });

  it("escolhe o parser Santander quando o texto é de uma fatura Santander", () => {
    const result = parseInvoiceText(SANTANDER_SAMPLE);
    expect(result.bank).toBe("Santander");
  });

  it("lança BadRequestError com a lista de bancos suportados quando nenhum parser reconhece o texto", () => {
    expect(() => parseInvoiceText("Fatura de um banco desconhecido")).toThrow(BadRequestError);
    expect(() => parseInvoiceText("Fatura de um banco desconhecido")).toThrow(/Nubank, Santander/);
  });
});
