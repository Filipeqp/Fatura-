import * as React from "react";

import { MonthlyBarChart } from "@/components/overview/monthly-bar-chart";
import { cn } from "@/lib/utils";
import type { CategoryHistoryEntry } from "@/lib/types";

interface CategoryEvolutionPanelProps {
  categoryHistory: CategoryHistoryEntry[];
}

export function CategoryEvolutionPanel({ categoryHistory }: CategoryEvolutionPanelProps) {
  const [selectedId, setSelectedId] = React.useState(categoryHistory[0]?.categoryId);

  const selected = categoryHistory.find((c) => c.categoryId === selectedId) ?? categoryHistory[0];

  if (!selected) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">Evolução por categoria</h2>
        <select
          value={selected.categoryId}
          onChange={(e) => setSelectedId(e.target.value)}
          className={cn(
            "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          {categoryHistory.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <MonthlyBarChart title={`Evolução — ${selected.name}`} data={selected.months} color={selected.color} />
    </div>
  );
}
