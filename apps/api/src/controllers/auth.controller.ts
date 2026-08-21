import type { Request, Response } from "express";
import { z } from "zod";

import { UnauthorizedError } from "../lib/app-error.js";
import { REFRESH_TOKEN_MAX_AGE_MS } from "../lib/jwt.js";
import { authService } from "../services/auth.service.js";

const REFRESH_COOKIE_NAME = "refreshToken";

const googleLoginSchema = z.object({
  accessToken: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export async function googleLogin(req: Request, res: Response) {
  const { accessToken: googleAccessToken } = googleLoginSchema.parse(req.body);

  const { accessToken, refreshToken, user } = await authService.loginWithGoogle(googleAccessToken);

  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const { accessToken, refreshToken, user } = await authService.register(data);

  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const { accessToken, refreshToken, user } = await authService.loginWithPassword(email, password);

  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(email);
  res.status(204).send();
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(token, password);
  res.status(204).send();
}

export async function refresh(req: Request, res: Response) {
  const currentRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
  if (!currentRefreshToken) {
    throw new UnauthorizedError("Sessão não encontrada");
  }

  const { accessToken, refreshToken, user } = await authService.refreshSession(currentRefreshToken);

  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
}

export async function logout(req: Request, res: Response) {
  const currentRefreshToken = req.cookies[REFRESH_COOKIE_NAME];
  if (currentRefreshToken) {
    await authService.logout(currentRefreshToken);
  }
  res.clearCookie(REFRESH_COOKIE_NAME);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUser(req.userId!);
  if (!user) {
    throw new UnauthorizedError();
  }
  res.json({ user });
}
