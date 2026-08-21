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
import { apiPatch, apiPost } from "@/lib/api";
import type { CardBrand, CreditCard } from "@/lib/types";

const CARD_BRANDS: { value: CardBrand; label: string }[] = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "ELO", label: "Elo" },
  { value: "AMEX", label: "Amex" },
  { value: "OTHER", label: "Outra" },
];

const COLOR_PRESETS = [
  "#0d9488",
  "#4f46e5",
  "#9333ea",
  "#db2777",
  "#ea580c",
  "#059669",
  "#334155",
  "#dc2626",
];

const cardFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(40),
  brand: z.enum(["VISA", "MASTERCARD", "ELO", "AMEX", "OTHER"]),
  lastFourDigits: z.string().regex(/^\d{4}$|^$/, "Deve ter exatamente 4 dígitos"),
  color: z.string(),
});

type CardFormValues = z.infer<typeof cardFormSchema>;

interface CardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: CreditCard | null;
  onSaved: (card: CreditCard) => void;
}

export function CardFormDialog({ open, onOpenChange, card, onSaved }: CardFormDialogProps) {
  const isEditing = Boolean(card);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: { name: "", brand: "OTHER", lastFourDigits: "", color: COLOR_PRESETS[0] },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      name: card?.name ?? "",
      brand: card?.brand ?? "OTHER",
      lastFourDigits: card?.lastFourDigits ?? "",
      color: card?.color ?? COLOR_PRESETS[0],
    });
    setError(null);
  }, [open, card, reset]);

  const brand = watch("brand");
  const color = watch("color");

  const onSubmit = async (data: CardFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = { ...data, lastFourDigits: data.lastFourDigits || null };
      const result = isEditing
        ? await apiPatch<{ card: CreditCard }>(`/cards/${card!.id}`, payload)
        : await apiPost<{ card: CreditCard }>("/cards", payload);
      onSaved(result.card);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o cartão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cartão" : "Novo cartão"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize as informações do seu cartão." : "Cadastre um cartão para organizar suas faturas."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do cartão</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank, Itaú Click"
              disabled={isSubmitting}
              className={cn(errors.name && "border-destructive")}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Bandeira</Label>
            <div className="flex flex-wrap gap-2">
              {CARD_BRANDS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={brand === option.value ? "default" : "outline"}
                  disabled={isSubmitting}
                  onClick={() => setValue("brand", option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastFourDigits">Últimos 4 dígitos (opcional)</Label>
            <Input
              id="lastFourDigits"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              disabled={isSubmitting}
              className={cn("max-w-24 font-mono", errors.lastFourDigits && "border-destructive")}
              {...register("lastFourDigits", {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
                },
              })}
            />
            {errors.lastFourDigits && <p className="text-xs text-destructive">{errors.lastFourDigits.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setValue("color", preset)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-transform hover:scale-110",
                    color === preset && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: preset }}
                  aria-label={`Selecionar cor ${preset}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
