import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
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
  );
}
