import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Auth } from "@/components/ui/auth-form-1";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { RequireAuth } from "@/components/require-auth";
import Dashboard from "@/pages/dashboard";
import CardDetail from "@/pages/card-detail";
import InvoiceDetail from "@/pages/invoice-detail";
import Categories from "@/pages/categories";
import Search from "@/pages/search";
import OverviewPage from "@/pages/overview";
import Account from "@/pages/account";
import ResetPassword from "@/pages/reset-password";
import { useAuth } from "@/lib/auth-context";

function AuthLayout({ initialView }: { initialView: "sign-in" | "sign-up" }) {
  const { status } = useAuth();

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-muted/30 p-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <Logo />
      <Auth initialView={initialView} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthLayout initialView="sign-in" />} />
        <Route path="/registrar" element={<AuthLayout initialView="sign-up" />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/cartoes/:cardId"
          element={
            <RequireAuth>
              <CardDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/cartoes/:cardId/faturas/:invoiceId"
          element={
            <RequireAuth>
              <InvoiceDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/categorias"
          element={
            <RequireAuth>
              <Categories />
            </RequireAuth>
          }
        />
        <Route
          path="/buscar"
          element={
            <RequireAuth>
              <Search />
            </RequireAuth>
          }
        />
        <Route
          path="/visao-geral"
          element={
            <RequireAuth>
              <OverviewPage />
            </RequireAuth>
          }
        />
        <Route
          path="/conta"
          element={
            <RequireAuth>
              <Account />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
