import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface AccessTokenPayload {
  sub: string;
}

export interface OpaqueToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AccessTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateOpaqueToken(ttlMs: number): OpaqueToken {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);

  return { token, tokenHash, expiresAt };
}

export function createRefreshToken(): OpaqueToken {
  return generateOpaqueToken(REFRESH_TOKEN_TTL_MS);
}

export function createPasswordResetToken(): OpaqueToken {
  return generateOpaqueToken(PASSWORD_RESET_TOKEN_TTL_MS);
}

export const REFRESH_TOKEN_MAX_AGE_MS = REFRESH_TOKEN_TTL_MS;
