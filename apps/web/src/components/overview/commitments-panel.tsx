import type { Commitment } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface CommitmentsPanelProps {
  commitments: Commitment[];
  totalAmount: number;
}

export function CommitmentsPanel({ commitments, totalAmount }: CommitmentsPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">Parcelamentos em andamento</h2>
        {commitments.length > 0 && (
          <span className="text-sm font-semibold text-foreground">{currencyFormatter.format(totalAmount)}</span>
        )}
      </div>

      {commitments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum parcelamento em aberto na última fatura de cada cartão.</p>
      ) : (
        <div className="space-y-3">
          {commitments.map((commitment, index) => (
            <div key={index} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">{commitment.description}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: commitment.cardColor }} />
                  <span className="truncate">
                    {commitment.cardName} · parcela {commitment.currentInstallment}/{commitment.totalInstallments}
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-medium text-foreground">{currencyFormatter.format(commitment.remainingAmount)}</p>
                <p className="text-xs text-muted-foreground">
                  +{commitment.remainingInstallments}{" "}
                  {commitment.remainingInstallments === 1 ? "parcela" : "parcelas"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
