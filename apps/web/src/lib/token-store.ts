/**
 * Guarda o access token fora do React para que o cliente HTTP (lib/api.ts)
 * consiga lê-lo e renová-lo sem depender de um componente/hook.
 */
let currentAccessToken: string | null = null;

type TokenListener = (token: string | null) => void;
const tokenListeners = new Set<TokenListener>();

type ExpiredListener = () => void;
const expiredListeners = new Set<ExpiredListener>();

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
  tokenListeners.forEach((listener) => listener(token));
}

export function subscribeAccessToken(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

/** Disparado quando uma renovação de sessão falha (refresh token inválido/expirado). */
export function notifySessionExpired(): void {
  expiredListeners.forEach((listener) => listener());
}

export function onSessionExpired(listener: ExpiredListener): () => void {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
}
