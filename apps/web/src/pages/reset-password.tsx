import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { apiPost } from "@/lib/api";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface PageState {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  showPassword: boolean;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-muted/30 p-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <Logo />
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-card/80 p-8 shadow-xl">{children}</div>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [state, setState] = React.useState<PageState>({ status: "idle", showPassword: false });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) return;
    setState((prev) => ({ ...prev, status: "loading" }));
    try {
      await apiPost("/auth/reset-password", { token, password: data.password });
      setState((prev) => ({ ...prev, status: "success" }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        message: err instanceof Error ? err.message : "Não foi possível redefinir a senha.",
      }));
    }
  };

  if (!token) {
    return (
      <PageShell>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Link inválido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esse link de redefinição está incompleto ou já foi usado.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate("/login")}>
            Voltar para o login
          </Button>
        </div>
      </PageShell>
    );
  }

  if (state.status === "success") {
    return (
      <PageShell>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Senha redefinida</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sua senha foi alterada com sucesso.</p>
          <Button className="mt-6 w-full" onClick={() => navigate("/login")}>
            Ir para o login
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">Escolha uma nova senha para sua conta</p>
      </div>

      {state.status === "error" && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={state.showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={state.status === "loading"}
              className={cn(errors.password && "border-destructive")}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setState((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
              disabled={state.status === "loading"}
            >
              {state.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={state.status === "loading"}>
          {state.status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Redefinir senha"
          )}
        </Button>
      </form>
    </PageShell>
  );
}
