import * as React from "react";
import { Loader2, Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { apiDelete, apiPost } from "@/lib/api";
import type { Category, CategoryRule } from "@/lib/types";

interface CategoryRulesManagerProps {
  category: Category;
  onRulesChange: (categoryId: string, rules: CategoryRule[]) => void;
}

export function CategoryRulesManager({ category, onRulesChange }: CategoryRulesManagerProps) {
  const [keyword, setKeyword] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setIsAdding(true);
    setError(null);
    try {
      const result = await apiPost<{ rule: CategoryRule }>(`/categories/${category.id}/rules`, { keyword: trimmed });
      onRulesChange(category.id, [...category.rules, result.rule]);
      setKeyword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível adicionar essa palavra-chave.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (rule: CategoryRule) => {
    setRemovingId(rule.id);
    setError(null);
    try {
      await apiDelete(`/categories/${category.id}/rules/${rule.id}`);
      onRulesChange(
        category.id,
        category.rules.filter((r) => r.id !== rule.id),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover essa palavra-chave.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {category.rules.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {category.rules.map((rule) => (
            <span
              key={rule.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {rule.keyword}
              <button
                type="button"
                onClick={() => handleRemove(rule)}
                disabled={removingId === rule.id}
                aria-label={`Remover ${rule.keyword}`}
                className="rounded-full transition-colors hover:text-destructive disabled:opacity-50"
              >
                {removingId === rule.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Adicionar palavra-chave (ex: IFOOD)"
          disabled={isAdding}
          className="h-8 max-w-56 text-xs"
        />
        <button
          type="submit"
          disabled={isAdding || !keyword.trim()}
          className="flex h-8 items-center gap-1 rounded-md border border-input px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Adicionar
        </button>
      </form>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
