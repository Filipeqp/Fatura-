import * as React from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiUpload } from "@/lib/api";
import type { CreditCard, Invoice } from "@/lib/types";

interface UploadInvoiceDialogProps {
  card: CreditCard | null;
  onOpenChange: (open: boolean) => void;
  onImported: (invoice: Invoice) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; invoice: Invoice }
  | { status: "error"; message: string };

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function UploadInvoiceDialog({ card, onOpenChange, onImported, onViewInvoice }: UploadInvoiceDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [state, setState] = React.useState<UploadState>({ status: "idle" });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (card) {
      setFile(null);
      setState({ status: "idle" });
    }
  }, [card]);

  const handleUpload = async () => {
    if (!file || !card) return;
    setState({ status: "loading" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await apiUpload<{ invoice: Invoice }>(`/cards/${card.id}/invoices`, formData);
      setState({ status: "success", invoice: data.invoice });
      onImported(data.invoice);
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Não foi possível importar a fatura.",
      });
    }
  };

  const isLoading = state.status === "loading";

  return (
    <Dialog open={Boolean(card)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar fatura</DialogTitle>
          <DialogDescription>
            Envie o PDF da fatura de {card?.name} para importar as compras automaticamente.
          </DialogDescription>
        </DialogHeader>

        {state.status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium text-foreground">
                Fatura de {monthFormatter.format(new Date(state.invoice.referenceMonth))} importada
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.invoice.items.length}{" "}
                {state.invoice.items.length === 1 ? "item importado" : "itens importados"}, total de{" "}
                {currencyFormatter.format(state.invoice.totalAmount)}
              </p>
            </div>
            <Button
              onClick={() => {
                onViewInvoice(state.invoice);
                onOpenChange(false);
              }}
            >
              Ver itens da fatura
            </Button>
          </div>
        ) : (
          <>
            {state.status === "error" && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {state.message}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50"
            >
              <FileUp className="h-6 w-6" />
              <span className="text-sm font-medium">{file ? file.name : "Clique para escolher o PDF"}</span>
              <span className="text-xs">Bancos suportados hoje: Nubank, Santander</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleUpload} disabled={!file || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Importar"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
