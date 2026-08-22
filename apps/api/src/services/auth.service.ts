import bcrypt from "bcrypt";

import { BadRequestError, ConflictError, UnauthorizedError } from "../lib/app-error.js";
import { fetchGoogleProfile } from "../lib/google-auth.js";
import { createPasswordResetToken, createRefreshToken, hashToken, signAccessToken } from "../lib/jwt.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";
import { userRepository } from "../repositories/user.repository.js";
import { categoryService } from "./category.service.js";

const PASSWORD_SALT_ROUNDS = 10;

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    hasPassword: Boolean(user.passwordHash),
    hasGoogle: Boolean(user.googleId),
  };
}

async function issueSession(user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
}) {
  const accessToken = signAccessToken(user.id);
  const { token: refreshToken, tokenHash, expiresAt } = createRefreshToken();
  await userRepository.createRefreshToken({ userId: user.id, tokenHash, expiresAt });

  return { accessToken, refreshToken, user: toPublicUser(user) };
}

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError("Já existe uma conta com esse e-mail");
    }

    const passwordHash = await bcrypt.hash(data.password, PASSWORD_SALT_ROUNDS);
    const user = await userRepository.createWithPassword({
      name: data.name,
      email: data.email,
      passwordHash,
    });
    await categoryService.seedDefaultsForUser(user.id);

    return issueSession(user);
  },

  async loginWithPassword(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedError("E-mail ou senha inválidos");
    }

    return issueSession(user);
  },

  async loginWithGoogle(googleAccessToken: string) {
    const profile = await fetchGoogleProfile(googleAccessToken);

    let user = await userRepository.findByGoogleId(profile.googleId);

    if (!user) {
      const existingByEmail = await userRepository.findByEmail(profile.email);
      if (existingByEmail) {
        user = await userRepository.linkGoogleId(existingByEmail.id, profile.googleId);
      } else {
        user = await userRepository.createFromGoogle(profile);
        await categoryService.seedDefaultsForUser(user.id);
      }
    }

    return issueSession(user);
  },

  /** Rotaciona o refresh token: revoga o antigo e emite um par novo (access + refresh). */
  async refreshSession(refreshToken: string) {
    const stored = await userRepository.findRefreshTokenByHash(hashToken(refreshToken));

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Sessão expirada, faça login novamente");
    }

    await userRepository.revokeRefreshToken(stored.id);

    const user = await userRepository.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedError("Sessão expirada, faça login novamente");
    }

    return issueSession(user);
  },

  /**
   * Sempre resolve com sucesso, exista ou não o e-mail — evita vazar quais
   * e-mails têm conta no sistema. Contas só-Google (sem senha) não recebem link.
   */
  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user?.passwordHash) return;

    const { token, tokenHash, expiresAt } = createPasswordResetToken();
    await userRepository.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });
    await sendPasswordResetEmail(user.email, user.name, token);
  },

  async resetPassword(token: string, newPassword: string) {
    const stored = await userRepository.findPasswordResetTokenByHash(hashToken(token));

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Link inválido ou expirado");
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await userRepository.updatePassword(stored.userId, passwordHash);
    await userRepository.markPasswordResetTokenUsed(stored.id);
    await userRepository.revokeAllRefreshTokens(stored.userId);
  },

  async logout(refreshToken: string) {
    const stored = await userRepository.findRefreshTokenByHash(hashToken(refreshToken));
    if (stored && !stored.revokedAt) {
      await userRepository.revokeRefreshToken(stored.id);
    }
  },

  async getUser(userId: string) {
    const user = await userRepository.findById(userId);
    return user ? toPublicUser(user) : null;
  },

  async updateProfile(userId: string, data: { name: string }) {
    const user = await userRepository.updateName(userId, data.name);
    return toPublicUser(user);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    if (!user.passwordHash) {
      throw new BadRequestError("Sua conta usa login do Google e não tem senha para trocar");
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedError("Senha atual incorreta");
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await userRepository.updatePassword(userId, passwordHash);
    await userRepository.revokeAllRefreshTokens(userId);
  },

  async deleteAccount(userId: string) {
    await userRepository.deleteUser(userId);
  },
};
