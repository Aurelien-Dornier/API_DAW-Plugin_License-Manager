// auth.config.ts
import { env } from "./env";
import type { SessionConfig, CookieOptions, TokenConfig } from "../types/auth.types";

export const SESSION_CONFIG: SessionConfig = {
  key: "koa.sess",
  maxAge: 86400000,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
};

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  maxAge: env.COOKIE_MAX_AGE,
  sameSite: "strict",
};

const TOKEN_CONFIG: TokenConfig = {
  secret: env.JWT_SECRET,
  accessTokenExpiration: '15m',  // 15 minutes
  refreshTokenExpiration: '7d',  // 7 jours
  refreshTokenLength: 64,        // Longueur du refresh token
};

export const AUTH_CONFIG = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  tokens: TOKEN_CONFIG,
  session: {
    secret: env.SESSION_SECRET,
  },
  cookie: COOKIE_OPTIONS,
} as const;

export type AuthConfig = typeof AUTH_CONFIG;