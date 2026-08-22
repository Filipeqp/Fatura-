import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { cn } from "@/lib/utils";
import { apiPost } from "@/lib/api";
import type { Category, Invoice } from "@/lib/types";

function parseAmount(raw: string): number {
  return Number(raw.replace(",", "."));
}

const addItemSchema = z.object({
  description: z.string().min(1, "Informe a descrição").max(200),
  amount: z.string().refine((v) => Number.isFinite(parseAmount(v)) && parseAmount(v) > 0, {
    message: "Informe um valor maior que zero",
  }),
  date: z.string().min(1, "Informe a data"),
  categoryId: z.string(),
});

type AddItemFormValues = z.infer<typeof addItemSchema>;

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  invoiceId: string;
  categories: Category[];
  onAdded: (invoice: Invoice) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddItemDialog({ open, onOpenChange, cardId, invoiceId, categories, onAdded }: AddItemDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: { description: "", amount: "", date: today(), categoryId: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({ description: "", amount: "", date: today(), categoryId: "" });
    setError(null);
  }, [open, reset]);

  const onSubmit = async (data: AddItemFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await apiPost<{ invoice: Invoice }>(`/cards/${cardId}/invoices/${invoiceId}/items`, {
        description: data.description,
        amount: parseAmount(data.amount),
        date: new Date(`${data.date}T00:00:00Z`).toISOString(),
        categoryId: data.categoryId || null,
      });
      onAdded(result.invoice);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível adicionar o item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar item</DialogTitle>
          <DialogDescription>Lance uma compra manualmente nessa fatura (ex: pagamento em dinheiro).</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-description">Descrição</Label>
            <Input
              id="item-description"
              placeholder="Ex: Feira, Táxi, Presente"
              disabled={isSubmitting}
              className={cn(errors.description && "border-destructive")}
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-amount">Valor</Label>
              <Input
                id="item-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                disabled={isSubmitting}
                className={cn(errors.amount && "border-destructive")}
                {...register("amount")}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-date">Data</Label>
              <Input
                id="item-date"
                type="date"
                disabled={isSubmitting}
                className={cn(errors.date && "border-destructive")}
                {...register("date")}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-category">Categoria (opcional)</Label>
            <select
              id="item-category"
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              {...register("categoryId")}
            >
              <option value="">Sem categoria</option>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
