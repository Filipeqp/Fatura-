export type CardBrand = "VISA" | "MASTERCARD" | "ELO" | "AMEX" | "OTHER";

export interface CreditCard {
  id: string;
  name: string;
  brand: CardBrand;
  lastFourDigits: string | null;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = "OPEN" | "PAID" | "OVERDUE";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string | null;
  installment: string | null;
}

export interface Invoice {
  id: string;
  cardId: string;
  referenceMonth: string;
  dueDate: string;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: string;
  items: InvoiceItem[];
}
