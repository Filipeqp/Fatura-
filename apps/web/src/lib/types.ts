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
  _count?: { invoices: number };
  itemCount?: number;
}

export interface CategoryRule {
  id: string;
  keyword: string;
  categoryId: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  monthlyBudget: number | null;
  spentThisMonth: number;
  rules: CategoryRule[];
  _count: { items: number };
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

export interface ReimportConfirmation {
  requiresConfirmation: true;
  existing: { totalAmount: number; itemCount: number };
  incoming: { totalAmount: number; itemCount: number };
}

export interface MonthlyTotal {
  month: string;
  total: number;
}

export interface OverviewCategoryTotal {
  categoryId: string | null;
  name: string;
  color: string | null;
  amount: number;
}

export interface Commitment {
  description: string;
  cardName: string;
  cardColor: string;
  currentInstallment: number;
  totalInstallments: number;
  remainingInstallments: number;
  amount: number;
  remainingAmount: number;
}

export interface Overview {
  monthly: MonthlyTotal[];
  currentMonthTotal: number;
  categoryBreakdown: OverviewCategoryTotal[];
  commitments: Commitment[];
  totalCommitmentAmount: number;
  cardCount: number;
}

export interface SearchResultItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  installment: string | null;
  category: { id: string; name: string; color: string } | null;
  invoice: {
    id: string;
    referenceMonth: string;
    cardId: string;
    card: { id: string; name: string; color: string };
  };
}
