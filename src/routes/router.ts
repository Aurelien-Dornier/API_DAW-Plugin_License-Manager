import Router from "@koa/router";
import { authRoutes } from "./routes/auth.routes";
import { pluginRoutes } from "./routes/plugin.routes";
import { rateLimitRoutes } from "./routes/rate-limit.routes";

export const router = new Router({ prefix: "/api" });

// Route de base pour tester
router.get("/health", (ctx) => {
  ctx.body = { status: "ok", timestamp: new Date().toISOString() };
});

// Utilisation des routes d'authentification
router.use(authRoutes.routes());
router.use(pluginRoutes.routes());
router.use(rateLimitRoutes.routes());
