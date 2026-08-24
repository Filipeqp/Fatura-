import { describe, expect, it } from "vitest";

import { BadRequestError } from "../../lib/app-error.js";
import { nubankParser } from "./nubank.parser.js";

const SAMPLE = `
Nu Pagamentos S.A.
Fatura de cartão de crédito

Data de vencimento: 10 AGO 2026

Transações
16 JUL •••• 8405 Amazon - Parcela 2/3 R$ 79,08
20 JUL •••• 8405 Uber R$ 23,50
28 DEZ •••• 8405 Ifood R$ 45,00
Pagamento em 05/07 R$ 500,00

Total a pagar R$ 147,58
`;

describe("nubankParser.detect", () => {
  it("reconhece um texto de fatura Nubank", () => {
    expect(nubankParser.detect(SAMPLE)).toBe(true);
  });

  it("não reconhece um texto de outro banco", () => {
    expect(nubankParser.detect("Santander Fatura")).toBe(false);
  });
});

describe("nubankParser.parse", () => {
  it("extrai vencimento, total e itens da fatura", () => {
    const result = nubankParser.parse(SAMPLE);

    expect(result.bank).toBe("Nubank");
    expect(result.dueDate.toISOString()).toBe(new Date(Date.UTC(2026, 7, 10)).toISOString());
    expect(result.totalAmount).toBe(147.58);
    expect(result.items).toHaveLength(3);
  });

  it("ignora linhas que não são compra no cartão (ex: pagamento da fatura)", () => {
    const result = nubankParser.parse(SAMPLE);
    expect(result.items.some((item) => item.description.includes("Pagamento"))).toBe(false);
  });

  it("captura o parcelamento quando presente na linha", () => {
    const result = nubankParser.parse(SAMPLE);
    const amazon = result.items.find((item) => item.description === "Amazon");
    expect(amazon?.installment).toBe("2/3");
  });

  it("deixa installment nulo quando a compra não é parcelada", () => {
    const result = nubankParser.parse(SAMPLE);
    const uber = result.items.find((item) => item.description === "Uber");
    expect(uber?.installment).toBeNull();
  });

  it("resolve o ano anterior para compras de dezembro numa fatura que vence em janeiro/fevereiro", () => {
    const result = nubankParser.parse(SAMPLE);
    const ifood = result.items.find((item) => item.description === "Ifood");
    expect(ifood?.date.getUTCFullYear()).toBe(2025);
  });

  it("lança BadRequestError quando não encontra a data de vencimento", () => {
    expect(() => nubankParser.parse("Nu Pagamentos S.A. sem data")).toThrow(BadRequestError);
  });

  it("lança BadRequestError quando não encontra o total", () => {
    expect(() => nubankParser.parse("Data de vencimento: 10 AGO 2026")).toThrow(BadRequestError);
  });
});
