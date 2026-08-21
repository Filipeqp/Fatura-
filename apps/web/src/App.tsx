import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { Auth } from "@/components/ui/auth-form-1";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { RequireAuth } from "@/components/require-auth";
import Dashboard from "@/pages/dashboard";
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
      </Routes>
    </BrowserRouter>
  );
}
