import type { Context } from "koa";
import cors from "@koa/cors";
import { env } from "../config/env";

export const corsMiddleware = () => {
  const allowedOrigins = env.ALLOWED_ORIGINS;
  
  return cors({
    origin: (ctx: Context) => {
      const origin = ctx.get('Origin');
      if (!origin) return allowedOrigins[0]; // Valeur par défaut
      
      if (env.NODE_ENV === 'development') {
        // En développement, on est plus permissif
        return origin;
      }
      
      // En production, on vérifie strictement
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      return allowedOrigins[0];
    },
    credentials: true,
    maxAge: 86400,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposeHeaders: ['set-cookie'],
  });
};