import Router from "@koa/router";
import { authRoutes } from "@/routes/routes/auth.routes.js";
import { pluginRoutes } from "@/routes/routes/plugin.routes.js";
import { rateLimitRoutes } from "@/routes/routes/rate-limit.routes.js";

export const router = new Router({ prefix: "/api" });

// Route de base pour tester
router.get("/health", (ctx) => {
  ctx.body = { status: "ok", timestamp: new Date().toISOString() };
});

// Utilisation des routes d'authentification
router.use(authRoutes.routes());
router.use(pluginRoutes.routes());
router.use(rateLimitRoutes.routes());
