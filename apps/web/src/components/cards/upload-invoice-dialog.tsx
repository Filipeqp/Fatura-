import * as React from "react";
import { AlertTriangle, CheckCircle2, FileUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiUpload, type ApiError } from "@/lib/api";
import type { CreditCard, Invoice, ReimportConfirmation } from "@/lib/types";

interface UploadInvoiceDialogProps {
  card: CreditCard | null;
  onOpenChange: (open: boolean) => void;
  onImported: (invoice: Invoice) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "confirm"; existing: ReimportConfirmation["existing"]; incoming: ReimportConfirmation["incoming"] }
  | { status: "success"; invoice: Invoice }
  | { status: "error"; message: string };

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function isReimportConfirmation(body: unknown): body is ReimportConfirmation {
  return Boolean(body) && typeof body === "object" && (body as ReimportConfirmation).requiresConfirmation === true;
}

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

  const handleUpload = async (force = false) => {
    if (!file || !card) return;
    setState({ status: "loading" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (force) formData.append("force", "true");
      const data = await apiUpload<{ invoice: Invoice }>(`/cards/${card.id}/invoices`, formData);
      setState({ status: "success", invoice: data.invoice });
      onImported(data.invoice);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 409 && isReimportConfirmation(apiError.body)) {
        setState({ status: "confirm", existing: apiError.body.existing, incoming: apiError.body.incoming });
        return;
      }
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

        {state.status === "confirm" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Já existe uma fatura importada pra esse mês, com um valor bem diferente do novo arquivo. Confira antes
                de substituir.
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Já importada</p>
                <p className="font-medium text-foreground">{currencyFormatter.format(state.existing.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">
                  {state.existing.itemCount} {state.existing.itemCount === 1 ? "item" : "itens"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Novo arquivo</p>
                <p className="font-medium text-foreground">{currencyFormatter.format(state.incoming.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">
                  {state.incoming.itemCount} {state.incoming.itemCount === 1 ? "item" : "itens"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setState({ status: "idle" })}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={() => handleUpload(true)}>
                Substituir mesmo assim
              </Button>
            </DialogFooter>
          </div>
        ) : state.status === "success" ? (
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
              <Button type="button" onClick={() => handleUpload(false)} disabled={!file || isLoading}>
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
