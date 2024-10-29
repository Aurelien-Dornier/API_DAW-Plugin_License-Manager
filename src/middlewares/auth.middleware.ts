import type { Context, Next } from "koa";
import jwt from "jsonwebtoken";
import { prisma } from "@/config/database.js";
import { AUTH_CONFIG } from "@/config/auth.config.js";
import type { JWTTPayload } from "@/types/auth.types.js";

/**
 * * verifier le token et ajouter l'utilisateur au contexte si le token est valide
 * @param {Context} ctx
 * @param {Next} next
 * @return {*}  {Promise<void>}
 */
export async function authenticateToken(ctx: Context, next: Next): Promise<void> {
  const token = ctx.cookies.get("access_token");
  if (!token) {
    ctx.status = 410;
    ctx.body = { success: false, message: "No token provided" };
    return;
  }

  try {
    /* verifier le token */
    const playload = jwt.verify(token, AUTH_CONFIG.jwt.secret) as JWTTPayload;

    /* verifier si l'utilisateur existe */
    const user = await prisma.user.findUnique({
      where: { id: playload.userId },
      select: { id: true, status: true, twoFactorStatus: true, role: true },
    });

    /* verifier si l'utilisateur est bloqué */
    if (!user || user.status === "BLOCKED") {
      ctx.status = 401;
      ctx.body = { success: false, message: "Unauthorized" };
      return;
    }

    /* ajouter l'utilisateur au contexte */
    ctx.state.user = {
      id: user.id,
      role: user.role,
      twoFactorStatus: user.twoFactorStatus,
      status: user.status,
    };

    await next();
  } catch (error) {
    ctx.status = 403;
    ctx.body = { success: false, message: "Forbidden" };
  }

};