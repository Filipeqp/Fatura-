import { getAccessToken, notifySessionExpired, setAccessToken } from "@/lib/token-store";

const API_URL = import.meta.env.VITE_API_URL;

interface RequestOptions {
  accessToken?: string | null;
}

export interface ApiError extends Error {
  status?: number;
  body?: unknown;
}

async function rawRequest<TResponse>(
  path: string,
  init: RequestInit,
  token?: string | null,
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  // FormData define seu próprio Content-Type (multipart, com boundary) — não sobrescrever.
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    const error: ApiError = new Error(data?.error ?? "Erro inesperado");
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data as TResponse;
}

let refreshPromise: Promise<string | null> | null = null;

/** Renova a sessão via cookie de refresh. Chamadas concorrentes compartilham a mesma promise. */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = rawRequest<{ accessToken: string }>("/auth/refresh", { method: "POST" })
      .then((data) => {
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        notifySessionExpired();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<TResponse>(
  path: string,
  init: RequestInit,
  options: RequestOptions = {},
): Promise<TResponse> {
  const token = options.accessToken !== undefined ? options.accessToken : getAccessToken();

  try {
    return await rawRequest<TResponse>(path, init, token);
  } catch (err) {
    const status = (err as ApiError).status;
    const isAuthEndpoint = path.startsWith("/auth/");

    if (status === 401 && !isAuthEndpoint) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return rawRequest<TResponse>(path, init, newToken);
      }
    }

    throw err;
  }
}

export function apiPost<TResponse>(path: string, body?: unknown, options?: RequestOptions): Promise<TResponse> {
  return request<TResponse>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, options);
}

export function apiGet<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
  return request<TResponse>(path, { method: "GET" }, options);
}

export function apiPatch<TResponse>(path: string, body?: unknown, options?: RequestOptions): Promise<TResponse> {
  return request<TResponse>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }, options);
}

export function apiDelete<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
  return request<TResponse>(path, { method: "DELETE" }, options);
}

export function apiUpload<TResponse>(path: string, formData: FormData, options?: RequestOptions): Promise<TResponse> {
  return request<TResponse>(path, { method: "POST", body: formData }, options);
}
