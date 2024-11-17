// auth.middleware.ts
import type { Context, Next } from "koa";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { AUTH_CONFIG } from "../config/auth.config";
import { TokenService } from "../services/token.service";
import type { JWTTPayload } from "../types/auth.types";

export async function authenticateToken(ctx: Context, next: Next): Promise<void> {
  try {
    const accessToken = ctx.cookies.get("access_token");
    const refreshToken = ctx.cookies.get("refresh_token");

    if (!accessToken) {
      ctx.status = 401;
      ctx.body = { 
        success: false, 
        message: "Non authentifié"
      };
      return;
    }

    try {
      // Vérifier si le token est blacklisté
      const isBlacklisted = await TokenService.isTokenBlacklisted(accessToken);
      if (isBlacklisted) {
        throw new Error('Token blacklisté');
      }

      // Vérifier le token
      const payload = jwt.verify(accessToken, AUTH_CONFIG.jwt.secret) as JWTTPayload;
      
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
      // Si le token est expiré et qu'un refresh token est disponible
      if (error instanceof jwt.TokenExpiredError && refreshToken) {
        const newTokens = await TokenService.refreshTokens(refreshToken);
        
        if (newTokens) {
          // Mettre à jour les cookies
          ctx.cookies.set("access_token", newTokens.accessToken, AUTH_CONFIG.cookie);
          ctx.cookies.set("refresh_token", newTokens.refreshToken, AUTH_CONFIG.cookie);
          
          // Réessayer la vérification avec le nouveau token
          const payload = jwt.verify(newTokens.accessToken, AUTH_CONFIG.jwt.secret) as JWTTPayload;
          
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
          return;
        }
      }

      // En cas d'erreur, supprimer les cookies
      ctx.cookies.set("access_token", "", { ...AUTH_CONFIG.cookie, maxAge: 0 });
      ctx.cookies.set("refresh_token", "", { ...AUTH_CONFIG.cookie, maxAge: 0 });

      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "Token invalide ou expiré"
      };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "Erreur serveur"
    };
  }
}