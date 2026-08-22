import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPost } from "@/lib/api";
import type { Category, CategoryRule, InvoiceItem } from "@/lib/types";

interface CreateRuleDialogProps {
  item: InvoiceItem | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onCreated: (categoryId: string, rule: CategoryRule) => void;
}

export function CreateRuleDialog({ item, categories, onOpenChange, onCreated }: CreateRuleDialogProps) {
  const [categoryId, setCategoryId] = React.useState("");
  const [keyword, setKeyword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!item) return;
    setCategoryId(item.categoryId ?? categories[0]?.id ?? "");
    setKeyword(item.description.toUpperCase());
    setError(null);
  }, [item, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKeyword = keyword.trim();
    if (!categoryId || !trimmedKeyword) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await apiPost<{ rule: CategoryRule }>(`/categories/${categoryId}/rules`, {
        keyword: trimmedKeyword,
      });
      onCreated(categoryId, result.rule);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a regra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar regra de categorização</DialogTitle>
          <DialogDescription>
            Itens parecidos com esse serão categorizados automaticamente da próxima vez.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie uma categoria primeiro pra poder associar uma regra.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-keyword">Palavra-chave</Label>
              <Input
                id="rule-keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Baseado em &quot;{item?.description}&quot; — edite pra deixar mais genérico se quiser.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-category">Categoria</Label>
              <select
                id="rule-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !categoryId || !keyword.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar regra"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
