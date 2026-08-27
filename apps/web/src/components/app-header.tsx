import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { NAV_ITEMS } from "@/lib/nav-items";

export function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="dark sticky top-0 z-40 bg-accent/75 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                variant={location.pathname.startsWith(item.to) ? "secondary" : "ghost"}
                size="sm"
                className="rounded-full text-foreground"
                asChild
              >
                <Link to={item.to}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            to="/conta"
            className="hidden text-sm text-muted-foreground hover:text-foreground hover:underline sm:inline"
          >
            Olá, {user?.name}
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full text-foreground sm:inline-flex"
            onClick={() => logout()}
          >
            Sair
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
