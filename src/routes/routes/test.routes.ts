// test.routes.ts
import Router from "@koa/router";
import { authenticateToken } from "../../middlewares/auth.middleware";
import jwt from "jsonwebtoken";

export const testRoutes = new Router({ prefix: "/test" });

// Route publique pour tester l'état des tokens
testRoutes.get("/token-info", async (ctx) => {
  const accessToken = ctx.cookies.get("access_token");
  const refreshToken = ctx.cookies.get("refresh_token");

  const tokenInfo = {
    access: accessToken ? {
      token: accessToken.substring(0, 10) + "...",
      decoded: accessToken ? jwt.decode(accessToken) : null
    } : null,
    refresh: refreshToken ? {
      token: refreshToken.substring(0, 10) + "...",
      decoded: refreshToken ? jwt.decode(refreshToken) : null
    } : null
  };

  ctx.body = {
    success: true,
    data: tokenInfo
  };
});

// Route protégée pour tester avec un délai
testRoutes.get("/delayed", authenticateToken, async (ctx) => {
  // Attendre 2 secondes
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  ctx.body = {
    success: true,
    message: "Delayed response successful",
    timestamp: new Date().toISOString()
  };
});