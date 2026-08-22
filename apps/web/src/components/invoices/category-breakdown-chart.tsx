import * as React from "react";

import { UNCATEGORIZED_COLOR, OTHER_BUCKET_COLOR } from "@/lib/chart-colors";
import type { Category, InvoiceItem } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export interface BreakdownEntry {
  key: string;
  name: string;
  color: string;
  amount: number;
}

// Cap na quantidade de fatias diretas; o resto dobra em "Outras categorias" —
// mantém o donut legível mesmo com muitas categorias.
const MAX_SLICES = 6;
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 80;
const STROKE = 26;
const GAP_DEG = 2;

export function foldEntries(rawEntries: BreakdownEntry[]): BreakdownEntry[] {
  const entries = [...rawEntries].sort((a, b) => b.amount - a.amount);

  if (entries.length <= MAX_SLICES + 1) return entries;

  const head = entries.slice(0, MAX_SLICES);
  const foldedAmount = entries.slice(MAX_SLICES).reduce((sum, e) => sum + e.amount, 0);
  head.push({ key: "__other", name: "Outras categorias", color: OTHER_BUCKET_COLOR, amount: foldedAmount });
  return head;
}

function buildBreakdown(items: InvoiceItem[], categories: Category[]): BreakdownEntry[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const key = item.categoryId ?? "__uncategorized";
    totals.set(key, (totals.get(key) ?? 0) + item.amount);
  }

  const entries: BreakdownEntry[] = Array.from(totals.entries()).map(([key, amount]) => {
    if (key === "__uncategorized") {
      return { key, name: "Sem categoria", color: UNCATEGORIZED_COLOR, amount };
    }
    const category = categories.find((c) => c.id === key);
    return {
      key,
      name: category?.name ?? "Categoria removida",
      color: category?.color ?? UNCATEGORIZED_COLOR,
      amount,
    };
  });

  return foldEntries(entries);
}

function BreakdownList({ entries, total }: { entries: BreakdownEntry[]; total: number }) {
  const maxAmount = Math.max(...entries.map((e) => e.amount), 1);

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const percentage = total > 0 ? (entry.amount / total) * 100 : 0;
        const barWidth = (entry.amount / maxAmount) * 100;

        return (
          <div key={entry.key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="truncate text-foreground">{entry.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${barWidth}%`, backgroundColor: entry.color }}
                />
              </div>
              <span className="shrink-0 text-xs font-medium text-foreground">
                {currencyFormatter.format(entry.amount)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DonutBreakdownProps {
  title: string;
  centerLabel: string;
  emptyMessage: string;
  entries: BreakdownEntry[];
  total: number;
}

export function DonutBreakdown({ title, centerLabel, emptyMessage, entries, total }: DonutBreakdownProps) {
  const circumference = 2 * Math.PI * RADIUS;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-medium text-foreground">{title}</h2>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-muted-foreground">
          <div className="h-28 w-28 rounded-full border-[14px] border-muted" />
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="relative mx-auto mb-6 aspect-square w-full max-w-[200px]">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full">
              <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-muted" />
              <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
                {(() => {
                  let cumulative = 0;
                  const gapLength = (GAP_DEG / 360) * circumference;

                  return entries.map((entry) => {
                    const fraction = total > 0 ? entry.amount / total : 0;
                    const rawLength = fraction * circumference;
                    const sliceLength = Math.max(rawLength - gapLength, 0);
                    const dashoffset = -cumulative;
                    cumulative += rawLength;

                    return (
                      <circle
                        key={entry.key}
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        fill="none"
                        stroke={entry.color}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
                        strokeDashoffset={dashoffset}
                      />
                    );
                  });
                })()}
              </g>
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold text-foreground">{currencyFormatter.format(total)}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{centerLabel}</span>
            </div>
          </div>

          <BreakdownList entries={entries} total={total} />
        </>
      )}
    </div>
  );
}

interface CategoryBreakdownChartProps {
  items: InvoiceItem[];
  categories: Category[];
}

export function CategoryBreakdownChart({ items, categories }: CategoryBreakdownChartProps) {
  const entries = React.useMemo(() => buildBreakdown(items, categories), [items, categories]);
  const total = React.useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

  return (
    <DonutBreakdown
      title="Gastos por categoria"
      centerLabel="total da fatura"
      emptyMessage="Nenhum gasto ainda"
      entries={entries}
      total={total}
    />
  );
}
