import Router from "@koa/router";
import { AuthController } from "@/controllers/auth.controller.js";
import { authenticateToken } from "@/middlewares/auth.middleware.js";

export const authRoutes = new Router({ prefix: "/auth" });

// Routes publiques
authRoutes.post("/register", ...AuthController.register);
authRoutes.post("/login", ...AuthController.login);
authRoutes.post("/logout", ...AuthController.logout);

// Routes protégées (nécessitent une authentification)
authRoutes.use(authenticateToken);
authRoutes.post("/2fa/setup", ...AuthController.setup2FA);
authRoutes.post("/2fa/verify", ...AuthController.verify2FA);
