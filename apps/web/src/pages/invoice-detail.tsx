import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Receipt, Sparkles, Tag, Trash2 } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { CreateRuleDialog } from "@/components/categories/create-rule-dialog";
import { AddItemDialog } from "@/components/invoices/add-item-dialog";
import { CategoryBreakdownChart } from "@/components/invoices/category-breakdown-chart";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, CategoryRule, Invoice, InvoiceItem } from "@/lib/types";

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
    <div className="relative flex min-w-0 flex-1 items-center gap-2">
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

function EditableDescription({
  value,
  onCommit,
  disabled,
}: {
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(value);

  if (!editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setText(value);
          setEditing(true);
        }}
        className="w-full rounded px-1 py-0.5 text-left text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
      >
        {value}
      </button>
    );
  }

  const commit = () => {
    const trimmed = text.trim();
    setEditing(false);
    if (trimmed && trimmed !== value) onCommit(trimmed);
  };

  return (
    <input
      autoFocus
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-full rounded border border-input bg-background px-1 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function EditableAmount({
  value,
  onCommit,
  disabled,
}: {
  value: number;
  onCommit: (value: number) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(String(value));

  if (!editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setText(String(value));
          setEditing(true);
        }}
        className="w-full rounded px-1 py-0.5 text-right font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
      >
        {currencyFormatter.format(value)}
      </button>
    );
  }

  const commit = () => {
    const parsed = Number(text.replace(",", "."));
    setEditing(false);
    if (Number.isFinite(parsed) && parsed !== value) onCommit(parsed);
  };

  return (
    <input
      autoFocus
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-full rounded border border-input bg-background px-1 py-0.5 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    />
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
  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [ruleItem, setRuleItem] = React.useState<InvoiceItem | null>(null);
  const [deletingItemId, setDeletingItemId] = React.useState<string | null>(null);

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

  const handleItemChange = async (
    itemId: string,
    data: Partial<{ description: string; amount: number; categoryId: string | null }>,
  ) => {
    if (!invoice || !cardId || !invoiceId) return;
    const previous = invoice;

    setInvoice({
      ...invoice,
      items: invoice.items.map((item) => (item.id === itemId ? { ...item, ...data } : item)),
    });
    setSavingItemId(itemId);

    try {
      await apiPatch(`/cards/${cardId}/invoices/${invoiceId}/items/${itemId}`, data);
    } catch {
      setInvoice(previous);
    } finally {
      setSavingItemId(null);
    }
  };

  const handleStatusChange = async (nextStatus: Invoice["status"]) => {
    if (!invoice || !cardId || !invoiceId) return;
    const previous = invoice;
    setInvoice({ ...invoice, status: nextStatus });
    try {
      await apiPatch(`/cards/${cardId}/invoices/${invoiceId}`, { status: nextStatus });
    } catch {
      setInvoice(previous);
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

  const handleDeleteItem = async (itemId: string) => {
    if (!cardId || !invoiceId) return;
    setDeletingItemId(itemId);
    try {
      const data = await apiDelete<{ invoice: Invoice }>(`/cards/${cardId}/invoices/${invoiceId}/items/${itemId}`);
      setInvoice(data.invoice);
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleRuleCreated = (categoryId: string, rule: CategoryRule) => {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, rules: [...c.rules, rule] } : c)));
    if (ruleItem) {
      handleItemChange(ruleItem.id, { categoryId });
    }
    setRuleItem(null);
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-6xl p-4 sm:p-8">
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
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
            <div className="min-w-0">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold capitalize text-foreground">
                    {monthFormatter.format(new Date(invoice.referenceMonth))}
                  </h1>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {invoice.items.length} {invoice.items.length === 1 ? "item" : "itens"}
                    </span>
                    <span>·</span>
                    <select
                      value={invoice.status}
                      onChange={(e) => handleStatusChange(e.target.value as Invoice["status"])}
                      className="rounded-md border border-input bg-background px-2 py-0.5 text-xs font-medium text-foreground"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                <Button variant="outline" size="sm" onClick={() => setAddItemOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar item
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
                  <div className="grid grid-cols-[3.5rem_1fr_11rem_auto_2rem] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span>Data</span>
                    <span>Descrição</span>
                    <span>Categoria</span>
                    <span className="text-right">Valor</span>
                    <span />
                  </div>
                  {invoice.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        "grid grid-cols-[3.5rem_1fr_11rem_auto_2rem] items-center gap-4 bg-card px-4 py-3 text-sm",
                        index > 0 && "border-t border-border",
                      )}
                    >
                      <span className="text-muted-foreground">{dateFormatter.format(new Date(item.date))}</span>
                      <div>
                        <EditableDescription
                          value={item.description}
                          disabled={savingItemId === item.id}
                          onCommit={(description) => handleItemChange(item.id, { description })}
                        />
                        {item.installment && (
                          <p className="px-1 text-xs text-muted-foreground">Parcela {item.installment}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <CategorySelect
                          categories={categories}
                          value={item.categoryId}
                          disabled={savingItemId === item.id}
                          onChange={(categoryId) => handleItemChange(item.id, { categoryId })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          aria-label="Criar regra a partir deste item"
                          onClick={() => setRuleItem(item)}
                        >
                          <Tag className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <EditableAmount
                        value={item.amount}
                        disabled={savingItemId === item.id}
                        onCommit={(amount) => handleItemChange(item.id, { amount })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label="Excluir item"
                        disabled={deletingItemId === item.id}
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        {deletingItemId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 lg:sticky lg:top-6 lg:mt-0">
              <CategoryBreakdownChart items={invoice.items} categories={categories} />
            </div>
          </div>
        )}
      </main>

      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSaved={(category) => setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))}
      />
      <CreateRuleDialog
        item={ruleItem}
        categories={categories}
        onOpenChange={(open) => !open && setRuleItem(null)}
        onCreated={handleRuleCreated}
      />
      {cardId && invoiceId && (
        <AddItemDialog
          open={addItemOpen}
          onOpenChange={setAddItemOpen}
          cardId={cardId}
          invoiceId={invoiceId}
          categories={categories}
          onAdded={setInvoice}
        />
      )}
    </div>
  );
}
