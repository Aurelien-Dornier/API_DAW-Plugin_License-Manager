import type { Context } from "koa";
import cors from "@koa/cors";
import { env } from "@/config/env.js";


export const corsMiddleware = () => {
  const allowedOrigins = env.ALLOWED_ORIGINS;

  return cors({
    origin: (ctx: Context) => {
      const origin = ctx.get('Origin');
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      return allowedOrigins[0];
    },
    credentials: true,
    maxAge: 86400, // 24 heures
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposeHeaders: ['set-cookies'],
  });
};