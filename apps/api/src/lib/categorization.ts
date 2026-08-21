export interface CategoryRule {
  keyword: string;
  categoryId: string;
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function normalize(text: string): string {
  return text.normalize("NFD").replace(COMBINING_DIACRITICS, "").toUpperCase();
}

/**
 * Retorna o id da categoria cuja regra bate com a descrição, ou null se nenhuma bater.
 * Quando mais de uma regra é compatível, a de palavra-chave mais longa vence (mais específica) —
 * evita que uma regra genérica ("MERCADO") esconda uma mais específica ("MERCADO LIVRE").
 */
export function categorize(description: string, rules: CategoryRule[]): string | null {
  const normalizedDescription = normalize(description);

  const match = rules
    .filter((rule) => normalizedDescription.includes(normalize(rule.keyword)))
    .sort((a, b) => b.keyword.length - a.keyword.length)[0];

  return match?.categoryId ?? null;
}
