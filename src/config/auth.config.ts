import { env } from "./env";
import type { SessionConfig, CookieOptions } from "../types/auth.types";

// Configuration de session typée
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

// Options de cookie typées
export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  maxAge: env.COOKIE_MAX_AGE,
  sameSite: "strict",
};

// Configuration d'authentification
export const AUTH_CONFIG = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  session: {
    secret: env.SESSION_SECRET,
  },
  cookie: COOKIE_OPTIONS,
} as const;

// Type pour l'export de la configuration
export type AuthConfig = typeof AUTH_CONFIG;
