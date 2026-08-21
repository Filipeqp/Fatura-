import { Pencil, Plus, Trash2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CardBrand, CreditCard } from "@/lib/types";

const BRAND_LABELS: Record<CardBrand, string | null> = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  ELO: "Elo",
  AMEX: "Amex",
  OTHER: null,
};

interface CardTileProps {
  card: CreditCard;
  onImport: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CardTile({ card, onImport, onEdit, onDelete }: CardTileProps) {
  const brandLabel = BRAND_LABELS[card.brand];

  return (
    <div
      data-slot="card-tile"
      className="group relative flex h-44 w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-transform hover:-translate-y-1"
      style={{
        background: `linear-gradient(135deg, ${card.color}, color-mix(in srgb, ${card.color} 55%, black))`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight opacity-95">{card.name}</span>
        {brandLabel && (
          <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {brandLabel}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span className="font-mono text-lg tracking-widest opacity-90">
          {card.lastFourDigits ? `•••• ${card.lastFourDigits}` : "•••• ••••"}
        </span>
        <div className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={onImport}
            aria-label="Importar fatura"
            className="rounded-full bg-white/15 p-1.5 transition-colors hover:bg-white/25"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar cartão"
            className="rounded-full bg-white/15 p-1.5 transition-colors hover:bg-white/25"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Excluir cartão"
            className="rounded-full bg-white/15 p-1.5 transition-colors hover:bg-white/25"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddCardTileProps {
  onClick: () => void;
  className?: string;
}

export function AddCardTile({ onClick, className }: AddCardTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary",
        className,
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="text-sm font-medium">Adicionar cartão</span>
    </button>
  );
}
