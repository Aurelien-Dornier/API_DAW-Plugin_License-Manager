import Router from "@koa/router";
import { AuthController } from "../../controllers/auth.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";

export const authRoutes = new Router({ prefix: "/auth" });

// Routes publiques
authRoutes.post("/register", ...AuthController.register);
authRoutes.post("/login", ...AuthController.login);
authRoutes.post("/logout", ...AuthController.logout);

// Routes protégées (nécessitent une authentification)
authRoutes.use(authenticateToken);
authRoutes.post("/2fa/setup", ...AuthController.setup2FA);
authRoutes.post("/2fa/verify", ...AuthController.verify2FA);
authRoutes.get("/2fa/status", ...AuthController.check2FAStatus);
authRoutes.get("/me", ...AuthController.me)


