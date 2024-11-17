// auth.types.ts
export interface JWTTPayload {
  userId: string;
  type: 'ACCESS' | 'REFRESH';
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID unique pour la révocation
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface Verify2FADto {
  token: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstname?: string;
  lastname?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user?: {
      id: string;
      email: string;
      status: string;
      role: string;
      profile?: {
        id: string;
        firstname?: string;
        lastname?: string;
      };
    };
    tokens?: TokenPair;
  } | null;
}

// Configuration types 
export interface SessionConfig {
  key: string;
  maxAge: number;
  autoCommit: boolean;
  overwrite: boolean;
  httpOnly: boolean;
  signed: boolean;
  rolling: boolean;
  renew: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

export interface TokenConfig {
  secret: string;
  accessTokenExpiration: string;
  refreshTokenExpiration: string;
  refreshTokenLength: number;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  maxAge: number;
  sameSite: 'lax' | 'strict' | 'none';
}

// Login attempts types
export interface LoginAttempt {
  id: string;
  ipAddress: string;
  userAgent?: string;
  email: string;
  success: boolean;
  createdAt: Date;
  expiresAt: Date;
}