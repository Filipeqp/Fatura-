import { describe, expect, it } from "vitest";

import { categorize, type CategoryRule } from "./categorization.js";

const rules: CategoryRule[] = [
  { keyword: "IFOOD", categoryId: "cat-alimentacao" },
  { keyword: "UBER", categoryId: "cat-transporte" },
  { keyword: "MERCADO", categoryId: "cat-mercado" },
  { keyword: "MERCADO LIVRE", categoryId: "cat-compras" },
];

describe("categorize", () => {
  it("retorna a categoria da regra que bate com a descrição", () => {
    expect(categorize("IFOOD *RESTAURANTE SABOR", rules)).toBe("cat-alimentacao");
  });

  it("não diferencia maiúsculas/minúsculas", () => {
    expect(categorize("uber trip", rules)).toBe("cat-transporte");
  });

  it("ignora acentos na descrição e na palavra-chave", () => {
    const withAccent: CategoryRule[] = [{ keyword: "FARMÁCIA", categoryId: "cat-saude" }];
    expect(categorize("DROGARIA FARMACIA SAO JOSE", withAccent)).toBe("cat-saude");
  });

  it("retorna null quando nenhuma regra bate", () => {
    expect(categorize("PADARIA DO ZE", rules)).toBeNull();
  });

  it("prefere a regra de palavra-chave mais específica (mais longa)", () => {
    expect(categorize("MERCADO LIVRE - PARCELA 1/3", rules)).toBe("cat-compras");
    expect(categorize("SUPERMERCADO EXTRA", rules)).toBe("cat-mercado");
  });

  it("retorna null quando não há regras", () => {
    expect(categorize("QUALQUER COISA", [])).toBeNull();
  });
});
