export interface DefaultCategory {
  name: string;
  color: string;
  keywords: string[];
}

/** Categorias e regras semeadas automaticamente para todo usuário novo. */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: "Alimentação",
    color: "#f97316",
    keywords: ["IFOOD", "RAPPI", "MC DONALDS", "MCDONALDS", "BURGER KING", "HABIBS"],
  },
  {
    name: "Transporte",
    color: "#0ea5e9",
    keywords: ["UBER", "99APP", "99POP", "POSTO", "SHELL", "IPIRANGA", "ESTACIONAMENTO", "CLICKBUS"],
  },
  {
    name: "Assinaturas",
    color: "#8b5cf6",
    keywords: [
      "NETFLIX",
      "SPOTIFY",
      "DISNEY PLUS",
      "HBO MAX",
      "AMAZON PRIME",
      "AMAZONPRIME",
      "YOUTUBE PREMIUM",
      "ICLOUD",
      "APPLE.COM",
    ],
  },
  {
    name: "Saúde",
    color: "#22c55e",
    keywords: ["FARMACIA", "DROGARIA", "DROGASIL", "PAGUE MENOS", "PANVEL"],
  },
  {
    name: "Mercado",
    color: "#eab308",
    keywords: ["SUPERMERCADO", "ATACADAO", "CARREFOUR", "PAO DE ACUCAR", "ASSAI", "HORTIFRUTI"],
  },
  {
    name: "Lazer",
    color: "#ec4899",
    keywords: ["CINEMA", "INGRESSO", "STEAM", "PLAYSTATION", "XBOX", "SYMPLA"],
  },
  {
    name: "Compras",
    color: "#6366f1",
    keywords: ["AMAZON", "MERCADO LIVRE", "MERCADOLIVRE", "SHOPEE", "MAGAZINE LUIZA", "SHEIN", "ALIEXPRESS"],
  },
  {
    name: "Outros",
    color: "#64748b",
    keywords: [],
  },
];
