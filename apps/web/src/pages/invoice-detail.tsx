import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Receipt } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { Invoice } from "@/lib/types";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABELS: Record<Invoice["status"], string> = {
  OPEN: "Em aberto",
  PAID: "Paga",
  OVERDUE: "Atrasada",
};

export default function InvoiceDetail() {
  const { cardId, invoiceId } = useParams<{ cardId: string; invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");

  React.useEffect(() => {
    if (!cardId || !invoiceId) return;
    apiGet<{ invoice: Invoice }>(`/cards/${cardId}/invoices/${invoiceId}`)
      .then((data) => {
        setInvoice(data.invoice);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [cardId, invoiceId]);

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(`/cartoes/${cardId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Faturas
        </Button>

        {status === "loading" && (
          <div className="flex h-44 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar essa fatura.
          </div>
        )}

        {status === "ready" && invoice && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold capitalize text-foreground">
                  {monthFormatter.format(new Date(invoice.referenceMonth))}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {invoice.items.length} {invoice.items.length === 1 ? "item" : "itens"} · {STATUS_LABELS[invoice.status]}
                </p>
              </div>
              <span className="text-xl font-semibold text-foreground">
                {currencyFormatter.format(invoice.totalAmount)}
              </span>
            </div>

            {invoice.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Receipt className="h-7 w-7" />
                </span>
                <p className="text-sm text-muted-foreground">Essa fatura não tem itens.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[3.5rem_1fr_auto] gap-4 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Data</span>
                  <span>Descrição</span>
                  <span className="text-right">Valor</span>
                </div>
                {invoice.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 bg-card px-4 py-3 text-sm ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <span className="text-muted-foreground">{dateFormatter.format(new Date(item.date))}</span>
                    <div>
                      <p className="text-foreground">{item.description}</p>
                      {item.installment && <p className="text-xs text-muted-foreground">Parcela {item.installment}</p>}
                    </div>
                    <span className="text-right font-medium text-foreground">
                      {currencyFormatter.format(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
