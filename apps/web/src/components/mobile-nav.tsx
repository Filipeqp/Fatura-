import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { NAV_ITEMS } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground sm:hidden" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm sm:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "dark fixed inset-y-0 right-0 z-50 flex h-full w-3/4 max-w-xs flex-col gap-6 border-l border-border bg-card p-6 shadow-xl duration-200 sm:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-sm font-medium text-muted-foreground">Menu</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="text-foreground" aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                variant={location.pathname.startsWith(item.to) ? "secondary" : "ghost"}
                className="justify-start rounded-full text-foreground"
                asChild
              >
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
            <Link to="/conta" className="text-sm text-muted-foreground hover:text-foreground">
              Olá, {user?.name}
            </Link>
            <Button variant="outline" className="rounded-full text-foreground" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
