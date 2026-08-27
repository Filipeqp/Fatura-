import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Sparkles, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { UploadInvoiceDialog } from "@/components/cards/upload-invoice-dialog";
import { apiGet, apiPost } from "@/lib/api";
import type { CreditCard, Invoice } from "@/lib/types";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABELS: Record<Invoice["status"], string> = {
  OPEN: "Em aberto",
  PAID: "Paga",
  OVERDUE: "Atrasada",
};

function getDueBadge(invoice: Invoice): { label: string; className: string } | null {
  if (invoice.status === "PAID") return null;

  const due = new Date(invoice.dueDate);
  const now = new Date();
  const dueUTC = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.round((dueUTC - nowUTC) / 86_400_000);

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return {
      label: `Atrasada há ${days} ${days === 1 ? "dia" : "dias"}`,
      className: "bg-destructive/10 text-destructive",
    };
  }

  if (diffDays <= 7) {
    return {
      label: diffDays === 0 ? "Vence hoje" : `Vence em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };
  }

  return null;
}

export default function CardDetail() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [card, setCard] = React.useState<CreditCard | null>(null);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [importing, setImporting] = React.useState(false);
  const [categorizing, setCategorizing] = React.useState(false);
  const [categorizeMessage, setCategorizeMessage] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!cardId) return;
    setStatus("loading");
    Promise.all([
      apiGet<{ card: CreditCard }>(`/cards/${cardId}`),
      apiGet<{ invoices: Invoice[] }>(`/cards/${cardId}/invoices`),
    ])
      .then(([cardData, invoicesData]) => {
        setCard(cardData.card);
        setInvoices(invoicesData.invoices);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [cardId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleCategorizeAll = async () => {
    if (!cardId) return;
    setCategorizing(true);
    setCategorizeMessage(null);
    try {
      const result = await apiPost<{ categorizedCount: number }>(`/cards/${cardId}/categorize`);
      setCategorizeMessage(
        result.categorizedCount === 0
          ? "Nenhum item novo pra categorizar."
          : `${result.categorizedCount} ${result.categorizedCount === 1 ? "item categorizado" : "itens categorizados"}.`,
      );
      load();
    } finally {
      setCategorizing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-5xl p-4 sm:p-8">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Meus cartões
        </Button>

        {status === "loading" && (
          <div className="flex h-44 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar esse cartão.
          </div>
        )}

        {status === "ready" && card && (
          <>
            <div
              className="mb-6 flex h-32 w-full max-w-sm flex-col justify-between rounded-2xl p-5 text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${card.color}, color-mix(in srgb, ${card.color} 55%, black))`,
              }}
            >
              <span className="text-sm font-medium opacity-95">{card.name}</span>
              <span className="font-mono text-lg tracking-widest opacity-90">
                {card.lastFourDigits ? `•••• ${card.lastFourDigits}` : "•••• ••••"}
              </span>
            </div>

            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-xl font-semibold text-foreground">Faturas</h1>
              <div className="flex flex-wrap gap-2">
                {invoices.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleCategorizeAll} disabled={categorizing}>
                    {categorizing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Categorizar todas as faturas
                  </Button>
                )}
                <Button size="sm" onClick={() => setImporting(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar fatura
                </Button>
              </div>
            </div>

            {categorizeMessage && <p className="mb-4 text-sm text-muted-foreground">{categorizeMessage}</p>}

            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="h-7 w-7" />
                </span>
                <div>
                  <h2 className="font-medium text-foreground">Nenhuma fatura importada ainda</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Envie o PDF da fatura desse cartão para começar.</p>
                </div>
                <Button onClick={() => setImporting(true)}>Importar fatura</Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                {invoices.map((invoice, index) => (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => navigate(`/cartoes/${cardId}/faturas/${invoice.id}`)}
                    className={`flex w-full items-center justify-between gap-4 bg-card p-4 text-left transition-colors hover:bg-accent ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium capitalize text-foreground">
                        {monthFormatter.format(new Date(invoice.referenceMonth))}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {invoice.items.length} {invoice.items.length === 1 ? "item" : "itens"} ·{" "}
                          {STATUS_LABELS[invoice.status]}
                        </span>
                        {(() => {
                          const badge = getDueBadge(invoice);
                          return badge ? (
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge.className)}>
                              {badge.label}
                            </span>
                          ) : null;
                        })()}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">{currencyFormatter.format(invoice.totalAmount)}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <UploadInvoiceDialog
        card={importing ? card : null}
        onOpenChange={(open) => setImporting(open)}
        onImported={() => load()}
        onViewInvoice={(invoice) => navigate(`/cartoes/${cardId}/faturas/${invoice.id}`)}
      />
    </div>
  );
}
