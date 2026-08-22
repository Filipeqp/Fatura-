import * as React from "react";
import { Loader2, Pencil, Plus, Sparkles, Tags, Trash2 } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { DeleteCategoryDialog } from "@/components/categories/delete-category-dialog";
import { CategoryRulesManager } from "@/components/categories/category-rules-manager";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, CategoryRule } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function BudgetControl({ category, onUpdated }: { category: Category; onUpdated: (category: Category) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(category.monthlyBudget != null ? String(category.monthlyBudget) : "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setValue(category.monthlyBudget != null ? String(category.monthlyBudget) : "");
  }, [category.monthlyBudget]);

  const commit = async () => {
    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : Number(trimmed.replace(",", "."));

    if (trimmed !== "" && (!Number.isFinite(parsed) || (parsed as number) <= 0)) {
      setValue(category.monthlyBudget != null ? String(category.monthlyBudget) : "");
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const result = await apiPatch<{ category: Category }>(`/categories/${category.id}`, { monthlyBudget: parsed });
      onUpdated({ ...category, ...result.category });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">R$</span>
        <input
          autoFocus
          inputMode="decimal"
          value={value}
          disabled={saving}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="Ex: 500"
          className="w-24 rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground">/mês</span>
      </div>
    );
  }

  if (category.monthlyBudget == null) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-xs text-primary hover:underline">
        Definir orçamento mensal
      </button>
    );
  }

  const spent = category.spentThisMonth;
  const budget = category.monthlyBudget;
  const percentage = Math.min((spent / budget) * 100, 100);
  const isOver = spent > budget;
  const isNear = !isOver && budget > 0 && spent / budget >= 0.8;
  const barColor = isOver ? "var(--destructive)" : isNear ? "#f59e0b" : category.color;

  return (
    <button type="button" onClick={() => setEditing(true)} className="block w-full max-w-56 text-left">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className={cn(isOver ? "font-medium text-destructive" : "text-muted-foreground")}>
          {currencyFormatter.format(spent)} de {currencyFormatter.format(budget)}
        </span>
        {isOver && <span className="shrink-0 font-medium text-destructive">estourou</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: barColor }} />
      </div>
    </button>
  );
}

export default function Categories() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = React.useState<Category | null>(null);
  const [seeding, setSeeding] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ categories: Category[] }>("/categories")
      .then((data) => {
        setCategories(data.categories);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleSaved = (category: Category) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id);
      const next = exists ? prev.map((c) => (c.id === category.id ? category : c)) : [...prev, category];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const handleDeleted = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const handleRulesChange = (categoryId: string, rules: CategoryRule[]) => {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, rules } : c)));
  };

  const handleBudgetUpdated = (category: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const data = await apiPost<{ categories: Category[] }>("/categories/seed-defaults");
      setCategories(data.categories);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Categorias</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize seus gastos e ensine o app a categorizar suas faturas automaticamente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSeedDefaults} disabled={seeding}>
              {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Usar categorias sugeridas
            </Button>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nova categoria
            </Button>
          </div>
        </div>

        {status === "loading" && (
          <div className="flex h-44 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar suas categorias. Tente recarregar a página.
          </div>
        )}

        {status === "ready" && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Tags className="h-7 w-7" />
            </span>
            <div>
              <h2 className="font-medium text-foreground">Nenhuma categoria ainda</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use as categorias sugeridas pra começar rápido, ou crie as suas.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSeedDefaults} disabled={seeding}>
                {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Usar sugeridas
              </Button>
              <Button onClick={openCreateDialog}>Criar categoria</Button>
            </div>
          </div>
        )}

        {status === "ready" && categories.length > 0 && (
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category._count.items} {category._count.items === 1 ? "item" : "itens"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Editar categoria"
                      onClick={() => {
                        setEditingCategory(category);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label="Excluir categoria"
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <CategoryRulesManager category={category} onRulesChange={handleRulesChange} />
                </div>

                <div className="mt-3 border-t border-border pt-3">
                  <BudgetControl category={category} onUpdated={handleBudgetUpdated} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} onSaved={handleSaved} />
      <DeleteCategoryDialog
        category={deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
