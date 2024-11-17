// token.service.ts
import { prisma } from "../config/database";
import { AUTH_CONFIG } from "../config/auth.config";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { JWTTPayload, TokenPair } from "../types/auth.types";

export class TokenService {
  /**
   * Génère une paire de tokens (access + refresh)
   */
  static async generateTokenPair(userId: string): Promise<TokenPair> {
    const jti = crypto.randomBytes(32).toString('hex');
    
    // Générer l'access token
    const accessToken = jwt.sign(
      { userId, type: 'ACCESS', jti } as JWTTPayload,
      AUTH_CONFIG.tokens.secret,
      { expiresIn: AUTH_CONFIG.tokens.accessTokenExpiration }
    );

    // Générer le refresh token
    const refreshToken = jwt.sign(
      { userId, type: 'REFRESH', jti } as JWTTPayload,
      AUTH_CONFIG.tokens.secret,
      { expiresIn: AUTH_CONFIG.tokens.refreshTokenExpiration }
    );

    // Sauvegarder le refresh token en base
    await prisma.refreshToken.create({
      data: {
        jti,
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Rafraîchit une paire de tokens
   */
  static async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    try {
      // Vérifier si le token est blacklisté
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        return null;
      }

      // Vérifier et décoder le refresh token
      const payload = jwt.verify(refreshToken, AUTH_CONFIG.tokens.secret) as JWTTPayload;
      
      if (payload.type !== 'REFRESH') {
        return null;
      }

      // Vérifier si le refresh token existe en base
      const storedToken = await prisma.refreshToken.findFirst({
        where: { 
          jti: payload.jti,
          userId: payload.userId,
          revoked: false
        }
      });

      if (!storedToken) {
        return null;
      }

      // Révoquer l'ancien refresh token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true }
      });

      // Générer une nouvelle paire de tokens
      return await this.generateTokenPair(payload.userId);
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return null;
    }
  }

  /**
   * Vérifie si un token est blacklisté
   */
  static async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = jwt.decode(token) as JWTTPayload;
      if (!decoded || !decoded.jti) return true;

      const blacklistedToken = await prisma.blacklistedToken.findUnique({
        where: { jti: decoded.jti }
      });

      return !!blacklistedToken;
    } catch {
      return true;
    }
  }

  /**
   * Révoque un token en l'ajoutant à la liste noire
   */
  static async revokeToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as JWTTPayload;
      if (!decoded || !decoded.jti) return;

      await prisma.blacklistedToken.create({
        data: {
          jti: decoded.jti,
          expiresAt: new Date(decoded.exp! * 1000)
        }
      });

      // Si c'est un refresh token, le révoquer également dans la table RefreshToken
      if (decoded.type === 'REFRESH') {
        await prisma.refreshToken.updateMany({
          where: { jti: decoded.jti },
          data: { revoked: true }
        });
      }
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }

  /**
   * Nettoie les tokens expirés
   */
  static async cleanup(): Promise<void> {
    const now = new Date();

    await Promise.all([
      // Nettoyer les refresh tokens expirés
      prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { revoked: true }
          ]
        }
      }),

      // Nettoyer les tokens blacklistés expirés
      prisma.blacklistedToken.deleteMany({
        where: { expiresAt: { lt: now } }
      })
    ]);
  }
}