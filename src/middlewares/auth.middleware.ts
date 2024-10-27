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
      select: { id: true, status: true, twoFactorStatus: true },
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
      twoFactorStatus: user.twoFactorStatus,
      status: user.status,
    };

    await next();
  } catch (error) {
    ctx.status = 403;
    ctx.body = { success: false, message: "Forbidden" };
  }

};



/**
* * limiter le nombre de tentatives de connexion
* @param {Context} ctx
* @param {Next} next
* @return {*}  {Promise<void>}
*/
export const loginRateLimit = async (ctx: Context, next: Next): Promise<void> => {
  const RATE_LIMIT_TIME = 15 * 60 * 1000; // 15 minutes
  const RATE_LIMIT_ATTEMPTS = 5;
  const ip = ctx.ip;

  /* compter le nombre de tentatives de connexion */
  const attempts = await prisma.session.count({
    where: {
      ipAddress: ip,
      createdAt: {
        gte: new Date(Date.now() - RATE_LIMIT_TIME)
      },
      token: "" // Ne compter que les tentatives échouées
    }
  });

  /* verifier la limite de tentatives de connexion */
  if (attempts >= RATE_LIMIT_ATTEMPTS) {
    ctx.status = 429;
    ctx.body = {
      success: false,
      message: 'Too many login attempts. Please try again later.',
      retryAfter: new Date(Date.now() + RATE_LIMIT_TIME).toISOString()
    };
    return;
  }

  await next();

  /*
   ! si la requête n'est pas réussie, enregistrer la tentative dans la base de données
   */
  if (ctx.status === 401) {
    const expiresAt = new Date(Date.now() + RATE_LIMIT_TIME);
    
    await prisma.session.create({
      data: {
        token: "",
        ipAddress: ip,
        userAgent: ctx.get("user-agent"),
        expiresAt: expiresAt,
        userId: null,
        createdAt: new Date()
      }
    });
  }
};
