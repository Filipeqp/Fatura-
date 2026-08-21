import * as React from "react";
import { CreditCard as CreditCardIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CardTile, AddCardTile } from "@/components/cards/card-tile";
import { CardFormDialog } from "@/components/cards/card-form-dialog";
import { DeleteCardDialog } from "@/components/cards/delete-card-dialog";
import { UploadInvoiceDialog } from "@/components/cards/upload-invoice-dialog";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api";
import type { CreditCard } from "@/lib/types";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [cards, setCards] = React.useState<CreditCard[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingCard, setEditingCard] = React.useState<CreditCard | null>(null);
  const [deletingCard, setDeletingCard] = React.useState<CreditCard | null>(null);
  const [importingCard, setImportingCard] = React.useState<CreditCard | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    apiGet<{ cards: CreditCard[] }>("/cards")
      .then((data) => {
        if (!cancelled) {
          setCards(data.cards);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openCreateDialog = () => {
    setEditingCard(null);
    setFormOpen(true);
  };

  const openEditDialog = (card: CreditCard) => {
    setEditingCard(card);
    setFormOpen(true);
  };

  const handleSaved = (card: CreditCard) => {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      return exists ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
    });
  };

  const handleDeleted = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <header className="border-b border-border/50 bg-card/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-sm text-muted-foreground sm:inline">Olá, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Meus cartões</h1>
            <p className="mt-1 text-sm text-muted-foreground">Organize os cartões usados para gerar suas faturas.</p>
          </div>
        </div>

        {status === "loading" && (
          <div className="flex h-44 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível carregar seus cartões. Tente recarregar a página.
          </div>
        )}

        {status === "ready" && cards.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCardIcon className="h-7 w-7" />
            </span>
            <div>
              <h2 className="font-medium text-foreground">Nenhum cartão cadastrado ainda</h2>
              <p className="mt-1 text-sm text-muted-foreground">Adicione seu primeiro cartão para começar.</p>
            </div>
            <Button onClick={openCreateDialog}>Adicionar cartão</Button>
          </div>
        )}

        {status === "ready" && cards.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                onImport={() => setImportingCard(card)}
                onEdit={() => openEditDialog(card)}
                onDelete={() => setDeletingCard(card)}
              />
            ))}
            <AddCardTile onClick={openCreateDialog} />
          </div>
        )}
      </main>

      <CardFormDialog open={formOpen} onOpenChange={setFormOpen} card={editingCard} onSaved={handleSaved} />
      <DeleteCardDialog card={deletingCard} onOpenChange={() => setDeletingCard(null)} onDeleted={handleDeleted} />
      <UploadInvoiceDialog
        card={importingCard}
        onOpenChange={(open) => !open && setImportingCard(null)}
        onImported={() => {}}
      />
    </div>
  );
}
