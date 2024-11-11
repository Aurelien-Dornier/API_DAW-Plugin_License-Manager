import type { Context, Next } from "koa";
import { RateLimitService } from "../services/rate-limit.service";

interface RateLimitResponse {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
  isBlocked?: boolean;
  timeRemaining?: number;
  retryAfter?: string;
}

export async function loginRateLimit(ctx: Context, next: Next): Promise<void> {
  const ip = ctx.ip;
  const email = (ctx.request.body as { email?: string })?.email || '';

  // Vérifier si l'IP est bloquée
  const isBlocked = await RateLimitService.isIpBlocked(ip);
  
  if (isBlocked) {
    const timeRemaining = await RateLimitService.getTimeUntilUnblock(ip);
    ctx.status = 429;
    ctx.body = {
      success: false,
      message: 'Too many login attempts. Please try again later.',
      retryAfter: new Date(Date.now() + (timeRemaining || 0)).toISOString(),
      timeRemaining: Math.ceil((timeRemaining || 0) / 1000) // en secondes
    } as RateLimitResponse;
    return;
  }

  // Stocker le status code initial
  const originalStatus = ctx.status;

  try {
    await next();

    // Enregistrer la tentative (succès ou échec)
    await RateLimitService.recordAttempt(
      ctx, 
      email, 
      ctx.status === 200 || ctx.status === 201
    );

  } catch (error) {
    // Enregistrer la tentative échouée en cas d'erreur
    await RateLimitService.recordAttempt(ctx, email, false);
    throw error;
  }

  // Si le status a changé et indique un échec d'authentification
  if (ctx.status !== originalStatus && ctx.status === 401) {
    const stats = await RateLimitService.getAttemptStats(ip);
    
    const currentBody = ctx.body as RateLimitResponse;
    
    // Ajouter des informations sur les tentatives restantes
    ctx.body = {
      success: false,
      message: currentBody.message || 'Authentication failed',
      attemptsRemaining: 5 - stats.recentAttempts, // Utiliser une constante pour MAX_ATTEMPTS
      isBlocked: stats.isBlocked,
      timeRemaining: stats.timeRemaining
    } as RateLimitResponse;
  }
}

