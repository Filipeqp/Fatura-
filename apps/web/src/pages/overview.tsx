import * as React from "react";
import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { DonutBreakdown, foldEntries } from "@/components/invoices/category-breakdown-chart";
import { MonthlyBarChart } from "@/components/overview/monthly-bar-chart";
import { CommitmentsPanel } from "@/components/overview/commitments-panel";
import { UNCATEGORIZED_COLOR } from "@/lib/chart-colors";
import { apiGet } from "@/lib/api";
import type { Overview } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function OverviewPage() {
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");

  React.useEffect(() => {
    apiGet<Overview>("/overview")
      .then((data) => {
        setOverview(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-5xl p-4 sm:p-8">
        <h1 className="mb-1 text-2xl font-semibold text-foreground">Visão geral</h1>
        <p className="mb-6 text-sm text-muted-foreground">Seus gastos em todos os cartões, num só lugar.</p>

        {status === "loading" && (
          <div className="flex h-44 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar sua visão geral.
          </div>
        )}

        {status === "ready" && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Gasto este mês</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {currencyFormatter.format(overview.currentMonthTotal)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  em {overview.cardCount} {overview.cardCount === 1 ? "cartão" : "cartões"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ainda a pagar (parcelado)</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {currencyFormatter.format(overview.totalCommitmentAmount)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {overview.commitments.length}{" "}
                  {overview.commitments.length === 1 ? "compra parcelada" : "compras parceladas"}
                </p>
              </div>
            </div>

            <MonthlyBarChart data={overview.monthly} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DonutBreakdown
                title="Gastos por categoria este mês"
                centerLabel="total do mês"
                emptyMessage="Nenhum gasto esse mês ainda"
                entries={foldEntries(
                  overview.categoryBreakdown.map((c) => ({
                    key: c.categoryId ?? "__uncategorized",
                    name: c.name,
                    color: c.color ?? UNCATEGORIZED_COLOR,
                    amount: c.amount,
                  })),
                )}
                total={overview.currentMonthTotal}
              />
              <CommitmentsPanel commitments={overview.commitments} totalAmount={overview.totalCommitmentAmount} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
