export interface DefaultCategory {
  name: string;
  color: string;
  keywords: string[];
}

/** Categorias e regras semeadas automaticamente para todo usuário novo. */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: "Alimentação",
    color: "#2a78d6",
    keywords: ["IFOOD", "RAPPI", "MC DONALDS", "MCDONALDS", "BURGER KING", "HABIBS"],
  },
  {
    name: "Transporte",
    color: "#eb6834",
    keywords: ["UBER", "99APP", "99POP", "POSTO", "SHELL", "IPIRANGA", "ESTACIONAMENTO", "CLICKBUS"],
  },
  {
    name: "Assinaturas",
    color: "#1baf7a",
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
    color: "#eda100",
    keywords: ["FARMACIA", "DROGARIA", "DROGASIL", "PAGUE MENOS", "PANVEL"],
  },
  {
    name: "Mercado",
    color: "#e87ba4",
    keywords: ["SUPERMERCADO", "ATACADAO", "CARREFOUR", "PAO DE ACUCAR", "ASSAI", "HORTIFRUTI"],
  },
  {
    name: "Lazer",
    color: "#008300",
    keywords: ["CINEMA", "INGRESSO", "STEAM", "PLAYSTATION", "XBOX", "SYMPLA"],
  },
  {
    name: "Compras",
    color: "#4a3aa7",
    keywords: ["AMAZON", "MERCADO LIVRE", "MERCADOLIVRE", "SHOPEE", "MAGAZINE LUIZA", "SHEIN", "ALIEXPRESS"],
  },
  {
    name: "Outros",
    color: "#e34948",
    keywords: [],
  },
];
