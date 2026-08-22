import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
  changePassword,
  deleteAccount,
  forgotPassword,
  googleLogin,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const authRoutes = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas contas criadas a partir deste IP. Tente novamente mais tarde." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas solicitações. Tente novamente em alguns minutos." },
});

authRoutes.post("/register", registerLimiter, register);
authRoutes.post("/login", loginLimiter, login);
authRoutes.post("/google", googleLogin);
authRoutes.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
authRoutes.post("/reset-password", resetPassword);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", logout);
authRoutes.get("/me", authenticate, me);
authRoutes.patch("/me", authenticate, updateProfile);
authRoutes.delete("/me", authenticate, deleteAccount);
authRoutes.post("/change-password", authenticate, changePassword);
