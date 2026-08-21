export interface ParsedInvoiceItem {
  description: string;
  amount: number;
  date: Date;
  installment: string | null;
}

export interface ParsedInvoice {
  bank: string;
  referenceMonth: Date;
  dueDate: Date;
  totalAmount: number;
  items: ParsedInvoiceItem[];
}

export interface InvoiceParser {
  bank: string;
  /** Verifica, a partir do texto extraído do PDF, se este parser sabe ler essa fatura. */
  detect: (text: string) => boolean;
  parse: (text: string) => ParsedInvoice;
}
