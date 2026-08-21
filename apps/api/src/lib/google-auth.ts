import { UnauthorizedError } from "./app-error.js";

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

/**
 * Troca o access token OAuth (obtido pelo token client no frontend) pelo perfil
 * do usuário, consultando diretamente os servidores do Google. Isso confirma que
 * o token é genuíno sem precisar validar assinatura/JWKS manualmente.
 */
export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new UnauthorizedError("Token do Google inválido");
  }

  const data = (await response.json()) as GoogleUserInfo;

  if (!data.sub || !data.email) {
    throw new UnauthorizedError("Token do Google inválido");
  }

  return { googleId: data.sub, email: data.email, name: data.name ?? data.email };
}
