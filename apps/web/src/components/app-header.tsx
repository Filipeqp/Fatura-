import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { to: "/visao-geral", label: "Visão geral" },
  { to: "/dashboard", label: "Cartões" },
  { to: "/categorias", label: "Categorias" },
  { to: "/buscar", label: "Buscar" },
];

export function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="border-b border-border/50 bg-card/50">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                variant={location.pathname.startsWith(item.to) ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/conta"
            className="hidden text-sm text-muted-foreground hover:text-foreground hover:underline sm:inline"
          >
            Olá, {user?.name}
          </Link>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
