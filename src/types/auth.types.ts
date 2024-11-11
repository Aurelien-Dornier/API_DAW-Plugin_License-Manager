export interface JWTTPayload {
  userId: string;
  type: 'ACCESS' | 'REFRESH';
  iat?: number;
  exp?: number;
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
    accessToken?: string;
  } | null;
}

// configuration types 
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

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  maxAge: number;
  sameSite: 'lax' | 'strict' | 'none';
}

// loginAttempts types
export interface LoginAttempt {
  id: string;
  ipAddress: string;
  userAgent?: string;
  email: string;
  success: boolean;
  createdAt: Date;
  expiresAt: Date;
}