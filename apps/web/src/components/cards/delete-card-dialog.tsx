import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiDelete } from "@/lib/api";
import type { CreditCard } from "@/lib/types";

interface DeleteCardDialogProps {
  card: CreditCard | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (cardId: string) => void;
}

export function DeleteCardDialog({ card, onOpenChange, onDeleted }: DeleteCardDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!card) return;
    setIsDeleting(true);
    setError(null);
    try {
      await apiDelete(`/cards/${card.id}`);
      onDeleted(card.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o cartão.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={Boolean(card)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir cartão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir {card ? `"${card.name}"` : "este cartão"}? As faturas vinculadas a ele
            também serão removidas. Essa ação não pode ser desfeita.
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
