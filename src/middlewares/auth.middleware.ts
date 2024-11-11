import type { Context, Next } from "koa";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { AUTH_CONFIG } from "../config/auth.config";
import type { JWTTPayload } from "../types/auth.types";

export async function authenticateToken(ctx: Context, next: Next): Promise<void> {
  try {
    // Vérifier tous les cookies disponibles
    const token = ctx.cookies.get("access_token");
    
    if (process.env.NODE_ENV === "development") {
      console.log({
        allCookies: ctx.headers.cookie,
        extractedToken: token,
        headers: ctx.headers,
      });
    }
    
    if (!token) {
      ctx.status = 401; // Changé de 410 à 401 pour être plus standard
      ctx.body = { 
        success: false, 
        message: "Non authentifié"
      };
      return;
    }

    const payload = jwt.verify(token, AUTH_CONFIG.jwt.secret) as JWTTPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { 
        id: true, 
        status: true, 
        twoFactorStatus: true, 
        role: true 
      },
    });

    if (!user || user.status === "BLOCKED") {
      ctx.status = 401;
      ctx.body = { 
        success: false, 
        message: user ? "Utilisateur bloqué" : "Utilisateur non trouvé"
      };
      return;
    }

    ctx.state.user = {
      id: user.id,
      role: user.role,
      twoFactorStatus: user.twoFactorStatus,
      status: user.status,
    };

    await next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "Token invalide ou expiré"
      };
      return;
    }

    // Pour toute autre erreur
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "Erreur serveur"
    };
  }
}