import * as React from "react";

import { apiPost } from "@/lib/api";
import { getAccessToken, onSessionExpired, setAccessToken, subscribeAccessToken } from "@/lib/token-store";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  hasPassword: boolean;
  hasGoogle: boolean;
}

interface AuthState {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  accessToken: string | null;
  login: (accessToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = { status: "loading", user: null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(INITIAL_STATE);
  const accessToken = React.useSyncExternalStore(subscribeAccessToken, getAccessToken);

  React.useEffect(() => {
    let cancelled = false;

    apiPost<{ accessToken: string; user: AuthUser }>("/auth/refresh")
      .then((data) => {
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setState({ status: "authenticated", user: data.user });
      })
      .catch(() => {
        if (!cancelled) {
          setAccessToken(null);
          setState({ status: "unauthenticated", user: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Disparado pelo cliente HTTP quando um refresh silencioso (após 401) falha.
  React.useEffect(() => {
    return onSessionExpired(() => {
      setState({ status: "unauthenticated", user: null });
    });
  }, []);

  const login = React.useCallback((token: string, user: AuthUser) => {
    setAccessToken(token);
    setState({ status: "authenticated", user });
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      setAccessToken(null);
      setState({ status: "unauthenticated", user: null });
    }
  }, []);

  const updateUser = React.useCallback((user: AuthUser) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const value = React.useMemo(
    () => ({ ...state, accessToken, login, logout, updateUser }),
    [state, accessToken, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
