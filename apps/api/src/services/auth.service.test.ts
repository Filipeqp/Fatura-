import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, ConflictError, UnauthorizedError } from "../lib/app-error.js";
import { fetchGoogleProfile } from "../lib/google-auth.js";
import { createPasswordResetToken, createRefreshToken, hashToken, signAccessToken } from "../lib/jwt.js";
import { sendPasswordResetEmail } from "../lib/mailer.js";
import { userRepository } from "../repositories/user.repository.js";
import { authService } from "./auth.service.js";
import { categoryService } from "./category.service.js";

vi.mock("../repositories/user.repository.js", () => ({
  userRepository: {
    findByGoogleId: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    createFromGoogle: vi.fn(),
    createWithPassword: vi.fn(),
    linkGoogleId: vi.fn(),
    createRefreshToken: vi.fn(),
    findRefreshTokenByHash: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllRefreshTokens: vi.fn(),
    updatePassword: vi.fn(),
    updateName: vi.fn(),
    deleteUser: vi.fn(),
    createPasswordResetToken: vi.fn(),
    findPasswordResetTokenByHash: vi.fn(),
    markPasswordResetTokenUsed: vi.fn(),
  },
}));

vi.mock("../lib/jwt.js", () => ({
  signAccessToken: vi.fn(),
  createRefreshToken: vi.fn(),
  createPasswordResetToken: vi.fn(),
  hashToken: vi.fn(),
}));

vi.mock("../lib/mailer.js", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("../lib/google-auth.js", () => ({
  fetchGoogleProfile: vi.fn(),
}));

vi.mock("./category.service.js", () => ({
  categoryService: {
    seedDefaultsForUser: vi.fn(),
  },
}));

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    name: "Filipe",
    email: "filipe@example.com",
    passwordHash: null as string | null,
    googleId: null as string | null,
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(signAccessToken).mockReturnValue("mock-access-token");
  vi.mocked(createRefreshToken).mockReturnValue({
    token: "mock-refresh-token",
    tokenHash: "mock-refresh-token-hash",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  });
  vi.mocked(hashToken).mockImplementation((token) => `hashed:${token}`);
});

describe("authService.register", () => {
  it("cria o usuário, semeia categorias padrão e emite uma sessão", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    const created = makeUser({ passwordHash: "hashed-password" });
    vi.mocked(userRepository.createWithPassword).mockResolvedValue(created as never);

    const result = await authService.register({
      name: "Filipe",
      email: "filipe@example.com",
      password: "senha123",
    });

    expect(userRepository.createWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Filipe", email: "filipe@example.com" }),
    );
    expect(categoryService.seedDefaultsForUser).toHaveBeenCalledWith("user-1");
    expect(userRepository.createRefreshToken).toHaveBeenCalledWith({
      userId: "user-1",
      tokenHash: "mock-refresh-token-hash",
      expiresAt: expect.any(Date),
    });
    expect(result).toEqual({
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      user: { id: "user-1", name: "Filipe", email: "filipe@example.com", hasPassword: true, hasGoogle: false },
    });
  });

  it("nunca guarda a senha em texto puro", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.createWithPassword).mockResolvedValue(makeUser() as never);

    await authService.register({ name: "Filipe", email: "filipe@example.com", password: "senha123" });

    const [{ passwordHash }] = vi.mocked(userRepository.createWithPassword).mock.calls[0];
    expect(passwordHash).not.toBe("senha123");
    expect(await bcrypt.compare("senha123", passwordHash)).toBe(true);
  });

  it("lança ConflictError e não cria usuário se o e-mail já existe", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser() as never);

    await expect(
      authService.register({ name: "Filipe", email: "filipe@example.com", password: "senha123" }),
    ).rejects.toThrow(ConflictError);
    expect(userRepository.createWithPassword).not.toHaveBeenCalled();
  });
});

describe("authService.loginWithPassword", () => {
  it("emite sessão quando a senha bate com o hash salvo", async () => {
    const passwordHash = await bcrypt.hash("senha123", 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash }) as never);

    const result = await authService.loginWithPassword("filipe@example.com", "senha123");

    expect(result.accessToken).toBe("mock-access-token");
  });

  it("lança UnauthorizedError quando a senha está errada", async () => {
    const passwordHash = await bcrypt.hash("senha123", 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash }) as never);

    await expect(authService.loginWithPassword("filipe@example.com", "senha-errada")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("lança UnauthorizedError quando o e-mail não existe", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(authService.loginWithPassword("ninguem@example.com", "senha123")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("lança UnauthorizedError quando a conta só tem login por Google (sem senha)", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      makeUser({ passwordHash: null, googleId: "g-1" }) as never,
    );

    await expect(authService.loginWithPassword("filipe@example.com", "qualquer")).rejects.toThrow(
      UnauthorizedError,
    );
  });
});

describe("authService.loginWithGoogle", () => {
  it("reutiliza o usuário quando já existe pelo googleId", async () => {
    vi.mocked(fetchGoogleProfile).mockResolvedValue({ googleId: "g-1", email: "filipe@example.com", name: "Filipe" });
    vi.mocked(userRepository.findByGoogleId).mockResolvedValue(makeUser({ googleId: "g-1" }) as never);

    await authService.loginWithGoogle("google-access-token");

    expect(userRepository.createFromGoogle).not.toHaveBeenCalled();
    expect(userRepository.linkGoogleId).not.toHaveBeenCalled();
  });

  it("vincula o googleId a uma conta existente com o mesmo e-mail", async () => {
    vi.mocked(fetchGoogleProfile).mockResolvedValue({ googleId: "g-1", email: "filipe@example.com", name: "Filipe" });
    vi.mocked(userRepository.findByGoogleId).mockResolvedValue(null);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash: "hash" }) as never);
    vi.mocked(userRepository.linkGoogleId).mockResolvedValue(makeUser({ googleId: "g-1" }) as never);

    await authService.loginWithGoogle("google-access-token");

    expect(userRepository.linkGoogleId).toHaveBeenCalledWith("user-1", "g-1");
    expect(userRepository.createFromGoogle).not.toHaveBeenCalled();
    expect(categoryService.seedDefaultsForUser).not.toHaveBeenCalled();
  });

  it("cria uma conta nova e semeia categorias quando não existe usuário nem por googleId nem por e-mail", async () => {
    vi.mocked(fetchGoogleProfile).mockResolvedValue({ googleId: "g-1", email: "novo@example.com", name: "Novo" });
    vi.mocked(userRepository.findByGoogleId).mockResolvedValue(null);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.createFromGoogle).mockResolvedValue(
      makeUser({ id: "user-2", email: "novo@example.com", googleId: "g-1" }) as never,
    );

    await authService.loginWithGoogle("google-access-token");

    expect(userRepository.createFromGoogle).toHaveBeenCalledWith({
      googleId: "g-1",
      email: "novo@example.com",
      name: "Novo",
    });
    expect(categoryService.seedDefaultsForUser).toHaveBeenCalledWith("user-2");
  });
});

describe("authService.refreshSession", () => {
  it("rotaciona o refresh token: revoga o antigo e emite um par novo", async () => {
    const stored = {
      id: "rt-1",
      userId: "user-1",
      tokenHash: "hashed:old-refresh-token",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
      createdAt: new Date(),
    };
    vi.mocked(userRepository.findRefreshTokenByHash).mockResolvedValue(stored as never);
    vi.mocked(userRepository.findById).mockResolvedValue(makeUser() as never);

    await authService.refreshSession("old-refresh-token");

    expect(userRepository.revokeRefreshToken).toHaveBeenCalledWith("rt-1");
    expect(userRepository.createRefreshToken).toHaveBeenCalled();
  });

  it("lança UnauthorizedError quando o refresh token não existe", async () => {
    vi.mocked(userRepository.findRefreshTokenByHash).mockResolvedValue(null);

    await expect(authService.refreshSession("token-desconhecido")).rejects.toThrow(UnauthorizedError);
  });

  it("lança UnauthorizedError quando o refresh token já foi revogado", async () => {
    vi.mocked(userRepository.findRefreshTokenByHash).mockResolvedValue({
      id: "rt-1",
      userId: "user-1",
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    } as never);

    await expect(authService.refreshSession("token-revogado")).rejects.toThrow(UnauthorizedError);
  });

  it("lança UnauthorizedError quando o refresh token está expirado", async () => {
    vi.mocked(userRepository.findRefreshTokenByHash).mockResolvedValue({
      id: "rt-1",
      userId: "user-1",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000 * 60),
    } as never);

    await expect(authService.refreshSession("token-expirado")).rejects.toThrow(UnauthorizedError);
  });
});

describe("authService.forgotPassword", () => {
  it("cria o token e envia o e-mail quando o usuário tem senha", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash: "hash" }) as never);
    vi.mocked(createPasswordResetToken).mockReturnValue({
      token: "reset-token",
      tokenHash: "reset-token-hash",
      expiresAt: new Date(),
    });

    await authService.forgotPassword("filipe@example.com");

    expect(userRepository.createPasswordResetToken).toHaveBeenCalled();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith("filipe@example.com", "Filipe", "reset-token");
  });

  it("não vaza se o e-mail existe: resolve em silêncio quando o usuário não existe", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(authService.forgotPassword("ninguem@example.com")).resolves.toBeUndefined();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("não envia link para contas só-Google (sem senha)", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(makeUser({ passwordHash: null }) as never);

    await authService.forgotPassword("filipe@example.com");

    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe("authService.resetPassword", () => {
  it("atualiza a senha, marca o token como usado e revoga todas as sessões", async () => {
    vi.mocked(userRepository.findPasswordResetTokenByHash).mockResolvedValue({
      id: "prt-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 1000 * 60),
    } as never);

    await authService.resetPassword("reset-token", "nova-senha123");

    expect(userRepository.updatePassword).toHaveBeenCalledWith("user-1", expect.any(String));
    expect(userRepository.markPasswordResetTokenUsed).toHaveBeenCalledWith("prt-1");
    expect(userRepository.revokeAllRefreshTokens).toHaveBeenCalledWith("user-1");
  });

  it("lança UnauthorizedError para token inexistente, já usado ou expirado", async () => {
    vi.mocked(userRepository.findPasswordResetTokenByHash).mockResolvedValue(null);
    await expect(authService.resetPassword("token-x", "nova-senha")).rejects.toThrow(UnauthorizedError);

    vi.mocked(userRepository.findPasswordResetTokenByHash).mockResolvedValue({
      id: "prt-1",
      userId: "user-1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60),
    } as never);
    await expect(authService.resetPassword("token-x", "nova-senha")).rejects.toThrow(UnauthorizedError);

    vi.mocked(userRepository.findPasswordResetTokenByHash).mockResolvedValue({
      id: "prt-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000 * 60),
    } as never);
    await expect(authService.resetPassword("token-x", "nova-senha")).rejects.toThrow(UnauthorizedError);
  });
});

describe("authService.changePassword", () => {
  it("troca a senha quando a senha atual está correta", async () => {
    const passwordHash = await bcrypt.hash("senha-atual", 10);
    vi.mocked(userRepository.findById).mockResolvedValue(makeUser({ passwordHash }) as never);

    await authService.changePassword("user-1", "senha-atual", "senha-nova");

    expect(userRepository.updatePassword).toHaveBeenCalledWith("user-1", expect.any(String));
    expect(userRepository.revokeAllRefreshTokens).toHaveBeenCalledWith("user-1");
  });

  it("lança UnauthorizedError quando a senha atual está incorreta", async () => {
    const passwordHash = await bcrypt.hash("senha-atual", 10);
    vi.mocked(userRepository.findById).mockResolvedValue(makeUser({ passwordHash }) as never);

    await expect(authService.changePassword("user-1", "senha-errada", "senha-nova")).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it("lança BadRequestError quando a conta usa login do Google e não tem senha", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(makeUser({ passwordHash: null }) as never);

    await expect(authService.changePassword("user-1", "qualquer", "senha-nova")).rejects.toThrow(BadRequestError);
  });

  it("lança UnauthorizedError quando o usuário não existe", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    await expect(authService.changePassword("user-inexistente", "a", "b")).rejects.toThrow(UnauthorizedError);
  });
});
