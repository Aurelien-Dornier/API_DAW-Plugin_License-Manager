// src/services/rate-limit.service.ts
import { prisma } from "../config/database";
import type { Context } from "koa";


export class RateLimitService {
  public static readonly MAX_ATTEMPTS = 5;
  private static readonly RATE_LIMIT_TIME = 15 * 60 * 1000; // 15 minutes
  private static readonly BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes de blocage

  /**
   * Vérifie si une IP est bloquée
   */
  static async isIpBlocked(ip: string): Promise<boolean> {
    const recentAttempts = await prisma.loginAttempt.count({
      where: {
        ipAddress: ip,
        success: false,
        createdAt: {
          gte: new Date(Date.now() - this.RATE_LIMIT_TIME)
        }
      }
    });

    return recentAttempts >= this.MAX_ATTEMPTS;
  }

  /**
   * Enregistre une tentative de connexion
   */
  static async recordAttempt(ctx: Context, email: string, success: boolean): Promise<void> {
    const expiresAt = new Date(Date.now() + this.BLOCK_DURATION);

    await prisma.loginAttempt.create({
      data: {
        ipAddress: ctx.ip,
        userAgent: ctx.get("user-agent"),
        email,
        success,
        expiresAt
      }
    });
  }

  /**
   * Récupère le temps restant avant déblocage
   */
  static async getTimeUntilUnblock(ip: string): Promise<number | null> {
    const oldestAttempt = await prisma.loginAttempt.findFirst({
      where: {
        ipAddress: ip,
        success: false,
        createdAt: {
          gte: new Date(Date.now() - this.RATE_LIMIT_TIME)
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (!oldestAttempt) return null;

    const timeElapsed = Date.now() - oldestAttempt.createdAt.getTime();
    const timeRemaining = this.RATE_LIMIT_TIME - timeElapsed;

    return timeRemaining > 0 ? timeRemaining : null;
  }

  /**
   * Nettoie les anciennes tentatives
   */
  static async cleanup(): Promise<void> {
    await prisma.loginAttempt.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - this.RATE_LIMIT_TIME)
        }
      }
    });
  }

  /**
   * Obtient les statistiques de tentatives pour une IP
   */
  static async getAttemptStats(ip: string): Promise<{
    recentAttempts: number;
    lastAttempt?: Date;
    isBlocked: boolean;
    timeRemaining?: number;
  }> {
    const [recentAttempts, lastAttempt] = await Promise.all([
      prisma.loginAttempt.count({
        where: {
          ipAddress: ip,
          success: false,
          createdAt: {
            gte: new Date(Date.now() - this.RATE_LIMIT_TIME)
          }
        }
      }),
      prisma.loginAttempt.findFirst({
        where: {
          ipAddress: ip
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          createdAt: true
        }
      })
    ]);

    const isBlocked = recentAttempts >= this.MAX_ATTEMPTS;
    let timeRemaining: number | undefined = undefined;

    if (isBlocked) {
      const remainingTime = await this.getTimeUntilUnblock(ip);
      timeRemaining = remainingTime !== null ? remainingTime : undefined;
    }

    return {
      recentAttempts,
      lastAttempt: lastAttempt?.createdAt,
      isBlocked,
      timeRemaining
    };
  }
}