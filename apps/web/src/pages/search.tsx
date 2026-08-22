import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search as SearchIcon } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";
import type { SearchResultItem } from "@/lib/types";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle");

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setStatus("idle");
      setResults([]);
      return;
    }

    setStatus("loading");
    const timeout = setTimeout(() => {
      apiGet<{ items: SearchResultItem[] }>(`/items?q=${encodeURIComponent(trimmed)}`)
        .then((data) => {
          setResults(data.items);
          setStatus("ready");
        })
        .catch(() => setStatus("error"));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <h1 className="mb-1 text-2xl font-semibold text-foreground">Buscar transações</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Procure por uma compra em todas as suas faturas, de qualquer cartão.
        </p>

        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Amazon, Spotify, Uber..."
            className="pl-9"
          />
        </div>

        {status === "loading" && (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível buscar agora. Tente de novo.
          </div>
        )}

        {status === "ready" && results.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma transação encontrada pra &quot;{query}&quot;.</p>
        )}

        {status === "ready" && results.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border">
            {results.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/cartoes/${item.invoice.cardId}/faturas/${item.invoice.id}`)}
                className={`flex w-full items-center justify-between gap-4 bg-card p-4 text-left text-sm transition-colors hover:bg-accent ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.description}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{dateFormatter.format(new Date(item.date))}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.invoice.card.color }}
                      />
                      {item.invoice.card.name}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{monthFormatter.format(new Date(item.invoice.referenceMonth))}</span>
                    {item.category && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.category.color }} />
                          {item.category.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="shrink-0 font-semibold text-foreground">{currencyFormatter.format(item.amount)}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
