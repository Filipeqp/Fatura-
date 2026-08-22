import type { MonthlyTotal } from "@/lib/types";

const monthLabelFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Mesmo azul do slot 1 da paleta categórica — usado aqui como cor sequencial
// (magnitude ao longo do tempo), não como identidade de categoria.
const ACCENT = "#2a78d6";

interface MonthlyBarChartProps {
  data: MonthlyTotal[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const lastIndex = data.length - 1;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-6 text-sm font-medium text-foreground">Gastos por mês</h2>
      <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
        {data.map((entry, index) => {
          const isCurrent = index === lastIndex;
          const heightPct = entry.total > 0 ? Math.max((entry.total / max) * 100, 3) : 0;

          return (
            <div key={entry.month} className="flex h-full flex-1 flex-col items-center gap-1.5">
              <div className="flex h-4 items-end">
                {isCurrent && (
                  <span className="whitespace-nowrap text-xs font-medium text-foreground">
                    {currencyFormatter.format(entry.total)}
                  </span>
                )}
              </div>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-8 rounded-t-md"
                  style={{ height: `${heightPct}%`, backgroundColor: isCurrent ? ACCENT : "var(--muted)" }}
                />
              </div>
              <span className="text-[10px] uppercase text-muted-foreground">
                {monthLabelFormatter.format(new Date(entry.month))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
