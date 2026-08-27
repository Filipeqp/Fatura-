import type { MonthlyTotal } from "@/lib/types";

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Mesmo azul do slot 1 da paleta categórica — usado aqui como cor sequencial
// (magnitude ao longo do tempo), não como identidade de categoria.
const ACCENT = "#2a78d6";

interface MonthlyBarChartProps {
  title?: string;
  data: MonthlyTotal[];
  projection?: MonthlyTotal[];
  color?: string;
}

export function MonthlyBarChart({ title = "Gastos por mês", data, projection = [], color = ACCENT }: MonthlyBarChartProps) {
  const allEntries = [...data, ...projection];
  const max = Math.max(...allEntries.map((d) => d.total), 1);
  const currentIndex = data.length - 1;
  const hasProjection = projection.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-6 text-sm font-medium text-foreground">{title}</h2>
      <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
        {allEntries.map((entry, index) => {
          const isCurrent = index === currentIndex;
          const isProjected = index > currentIndex;
          const heightPct = entry.total > 0 ? Math.max((entry.total / max) * 100, 3) : 0;

          return (
            <div key={entry.month} className="flex h-full flex-1 flex-col items-center gap-1.5">
              <div className="flex h-4 items-end">
                {isCurrent && entry.total > 0 && (
                  <span className="whitespace-nowrap text-xs font-medium text-foreground">
                    {currencyFormatter.format(entry.total)}
                  </span>
                )}
                {isProjected && entry.total > 0 && (
                  <span className="hidden whitespace-nowrap text-xs font-medium text-muted-foreground sm:inline">
                    {currencyFormatter.format(entry.total)}
                  </span>
                )}
              </div>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={`w-full max-w-8 rounded-t-md ${isProjected ? "border-2 border-dashed bg-transparent" : ""}`}
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: isProjected ? "transparent" : isCurrent ? color : "var(--muted)",
                    borderColor: isProjected ? color : undefined,
                  }}
                />
              </div>
              <span className="text-[10px] uppercase text-muted-foreground">
                {monthLabelFormatter.format(new Date(entry.month))}
              </span>
            </div>
          );
        })}
      </div>
      {hasProjection && (
        <p className="mt-4 text-[11px] text-muted-foreground">
          Barras tracejadas: previsão com base nas parcelas já comprometidas.
        </p>
      )}
    </div>
  );
}
