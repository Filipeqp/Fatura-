import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Receipt, Sparkles } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Category, Invoice } from "@/lib/types";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABELS: Record<Invoice["status"], string> = {
  OPEN: "Em aberto",
  PAID: "Paga",
  OVERDUE: "Atrasada",
};

interface CategorySelectProps {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  disabled?: boolean;
}

function CategorySelect({ categories, value, onChange, disabled }: CategorySelectProps) {
  const selected = categories.find((c) => c.id === value);

  return (
    <div className="relative flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: selected?.color ?? "var(--muted-foreground)" }}
      />
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full appearance-none rounded-md border border-input bg-background py-1.5 pl-1 pr-6 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Sem categoria</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function InvoiceDetail() {
  const { cardId, invoiceId } = useParams<{ cardId: string; invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [savingItemId, setSavingItemId] = React.useState<string | null>(null);
  const [categorizing, setCategorizing] = React.useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!cardId || !invoiceId) return;
    Promise.all([
      apiGet<{ invoice: Invoice }>(`/cards/${cardId}/invoices/${invoiceId}`),
      apiGet<{ categories: Category[] }>("/categories"),
    ])
      .then(([invoiceData, categoriesData]) => {
        setInvoice(invoiceData.invoice);
        setCategories(categoriesData.categories);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [cardId, invoiceId]);

  const handleCategoryChange = async (itemId: string, categoryId: string | null) => {
    if (!invoice || !cardId || !invoiceId) return;
    const previous = invoice;

    setInvoice({
      ...invoice,
      items: invoice.items.map((item) => (item.id === itemId ? { ...item, categoryId } : item)),
    });
    setSavingItemId(itemId);

    try {
      await apiPatch(`/cards/${cardId}/invoices/${invoiceId}/items/${itemId}`, { categoryId });
    } catch {
      setInvoice(previous);
    } finally {
      setSavingItemId(null);
    }
  };

  const handleAutoCategorize = async () => {
    if (!cardId || !invoiceId) return;
    setCategorizing(true);
    try {
      const data = await apiPost<{ invoice: Invoice }>(`/cards/${cardId}/invoices/${invoiceId}/categorize`, {});
      setInvoice(data.invoice);
    } finally {
      setCategorizing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-4xl p-4 sm:p-8">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(`/cartoes/${cardId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Faturas
        </Button>

        {status === "loading" && (
          <div className="flex h-44 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar essa fatura.
          </div>
        )}

        {status === "ready" && invoice && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold capitalize text-foreground">
                  {monthFormatter.format(new Date(invoice.referenceMonth))}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {invoice.items.length} {invoice.items.length === 1 ? "item" : "itens"} · {STATUS_LABELS[invoice.status]}
                </p>
              </div>
              <span className="text-xl font-semibold text-foreground">
                {currencyFormatter.format(invoice.totalAmount)}
              </span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoCategorize} disabled={categorizing}>
                {categorizing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Categorizar automaticamente
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova categoria
              </Button>
            </div>

            {invoice.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Receipt className="h-7 w-7" />
                </span>
                <p className="text-sm text-muted-foreground">Essa fatura não tem itens.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[3.5rem_1fr_9rem_auto] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Data</span>
                  <span>Descrição</span>
                  <span>Categoria</span>
                  <span className="text-right">Valor</span>
                </div>
                {invoice.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[3.5rem_1fr_9rem_auto] items-center gap-4 bg-card px-4 py-3 text-sm ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <span className="text-muted-foreground">{dateFormatter.format(new Date(item.date))}</span>
                    <div>
                      <p className="text-foreground">{item.description}</p>
                      {item.installment && <p className="text-xs text-muted-foreground">Parcela {item.installment}</p>}
                    </div>
                    <CategorySelect
                      categories={categories}
                      value={item.categoryId}
                      disabled={savingItemId === item.id}
                      onChange={(categoryId) => handleCategoryChange(item.id, categoryId)}
                    />
                    <span className="text-right font-medium text-foreground">
                      {currencyFormatter.format(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={(category) => setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))}
      />
    </div>
  );
}
