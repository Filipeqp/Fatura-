import * as React from "react";
import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteAccountDialog } from "@/components/account/delete-account-dialog";
import { apiPatch, apiPost } from "@/lib/api";
import { useAuth, type AuthUser } from "@/lib/auth-context";

export default function Account() {
  const { user, updateUser } = useAuth();

  const [name, setName] = React.useState(user?.name ?? "");
  const [savingName, setSavingName] = React.useState(false);
  const [nameMessage, setNameMessage] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (!user) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setNameMessage(null);
    setNameError(null);
    try {
      const result = await apiPatch<{ user: AuthUser }>("/auth/me", { name });
      updateUser(result.user);
      setNameMessage("Nome atualizado.");
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Não foi possível atualizar o nome.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);
    try {
      await apiPost("/auth/change-password", { currentPassword, newPassword });
      setPasswordMessage("Senha alterada. Suas outras sessões conectadas foram desconectadas.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Não foi possível trocar a senha.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Minha conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie seus dados e sua senha.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">Perfil</h2>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Nome</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={savingName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-email">E-mail</Label>
              <Input id="account-email" value={user.email} disabled />
            </div>
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            {nameMessage && <p className="text-xs text-emerald-600 dark:text-emerald-400">{nameMessage}</p>}
            <Button type="submit" disabled={savingName || name.trim().length < 2 || name === user.name}>
              {savingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </form>
        </div>

        {user.hasPassword ? (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-medium text-foreground">Alterar senha</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={changingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changingPassword}
                />
              </div>
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
              {passwordMessage && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{passwordMessage}</p>
              )}
              <Button type="submit" disabled={changingPassword || !currentPassword || newPassword.length < 8}>
                {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Trocar senha
              </Button>
            </form>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-medium text-foreground">Senha</h2>
            <p className="text-sm text-muted-foreground">
              Sua conta usa login com Google e não tem senha cadastrada.
            </p>
          </div>
        )}

        {user.hasGoogle && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 text-sm font-medium text-foreground">Google</h2>
            <p className="text-sm text-muted-foreground">Sua conta está conectada ao Google.</p>
          </div>
        )}

        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="mb-1 text-sm font-medium text-destructive">Zona de perigo</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Excluir sua conta apaga permanentemente todos os seus cartões, faturas e categorias.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Excluir minha conta
          </Button>
        </div>
      </main>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} userEmail={user.email} />
    </div>
  );
}
