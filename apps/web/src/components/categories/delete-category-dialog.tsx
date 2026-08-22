import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiDelete } from "@/lib/api";
import type { Category } from "@/lib/types";

interface DeleteCategoryDialogProps {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (categoryId: string) => void;
}

export function DeleteCategoryDialog({ category, onOpenChange, onDeleted }: DeleteCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!category) return;
    setIsDeleting(true);
    setError(null);
    try {
      await apiDelete(`/categories/${category.id}`);
      onDeleted(category.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir a categoria.");
    } finally {
      setIsDeleting(false);
    }
  };

  const itemCount = category?._count.items ?? 0;

  return (
    <Dialog open={Boolean(category)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir categoria</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir {category ? `"${category.name}"` : "esta categoria"}?
            {itemCount > 0
              ? ` ${itemCount} ${itemCount === 1 ? "item ficará" : "itens ficarão"} sem categoria — eles não são apagados.`
              : ""}{" "}
            As palavras-chave associadas a ela também são removidas.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
