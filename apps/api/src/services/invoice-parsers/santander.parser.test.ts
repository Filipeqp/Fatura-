import { describe, expect, it } from "vitest";

import { BadRequestError } from "../../lib/app-error.js";
import { santanderParser } from "./santander.parser.js";

const SAMPLE = `
Santander Cartões

Vencimento
10/02/2026

Parcelamentos
Compra Descrição Parcela Valor
10/01 MLP*KABUM MAGAZIN 07/10 296,84
1 14/04 CMSIABUFFET 04/04 492,12
15/12 LOJA DE NATAL 01/01 150,00
VALOR TOTAL

Total a Pagar
R$ 938,96
`;

describe("santanderParser.detect", () => {
  it("reconhece um texto de fatura Santander", () => {
    expect(santanderParser.detect(SAMPLE)).toBe(true);
  });

  it("não reconhece um texto de outro banco", () => {
    expect(santanderParser.detect("Nu Pagamentos S.A.")).toBe(false);
  });
});

describe("santanderParser.parse", () => {
  it("extrai vencimento, total e itens da fatura", () => {
    const result = santanderParser.parse(SAMPLE);

    expect(result.bank).toBe("Santander");
    expect(result.dueDate.toISOString()).toBe(new Date(Date.UTC(2026, 1, 10)).toISOString());
    expect(result.totalAmount).toBe(938.96);
    expect(result.items).toHaveLength(3);
  });

  it("ignora um caractere de ícone solto antes da data da linha", () => {
    const result = santanderParser.parse(SAMPLE);
    const item = result.items.find((i) => i.description === "CMSIABUFFET");
    expect(item).toBeDefined();
    expect(item?.installment).toBe("04/04");
  });

  it("usa a data da compra original, não a data de referência da fatura", () => {
    const result = santanderParser.parse(SAMPLE);
    const item = result.items.find((i) => i.description === "MLP*KABUM MAGAZIN");
    expect(item?.date.getUTCMonth()).toBe(0);
    expect(item?.date.getUTCDate()).toBe(10);
  });

  it("resolve o ano anterior para uma compra de dezembro numa fatura que referencia fevereiro", () => {
    const result = santanderParser.parse(SAMPLE);
    const item = result.items.find((i) => i.description === "LOJA DE NATAL");
    expect(item?.date.getUTCFullYear()).toBe(2025);
  });

  it("lança BadRequestError quando não encontra a data de vencimento", () => {
    expect(() => santanderParser.parse("Santander sem vencimento")).toThrow(BadRequestError);
  });

  it("lança BadRequestError quando não encontra o total", () => {
    expect(() => santanderParser.parse("Santander\nVencimento\n10/02/2026")).toThrow(BadRequestError);
  });
});
