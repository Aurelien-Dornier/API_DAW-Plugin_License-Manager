// auth.service.ts
import { prisma } from "../config/database";
import { hash, verify } from "argon2";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import type { Context } from "koa";
import { TokenService } from "./token.service";
import type { LoginDto, RegisterDto, AuthResponse } from "../types/auth.types";
import { AUTH_CONFIG } from "../config/auth.config";


export class AuthService {

  static async fetchUser(userId: string): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true,}
      });

      if (!user) {
        return {
          success: false,
          message: "user not found",
          data: null
        };
      }

      return {
        success: true,
        message: "user fetched successfully",
        data: {
        
          user: {
            
            id: user.id,
            email: user.email,
            status: user.status,
            role: user.role,
            profile: user.profile ? {
              id: user.profile.id,
              firstname: user.profile.firstName || undefined,
              lastname: user.profile.lastName || undefined,
            } : undefined
          },
        } 
        
      };
    } catch (error) {
      console.error("Fetch user error", error);
      return {
        success: false,
        message: "Failed to fetch user",
        data: null
      };
    }
  }

  static async register(dto: RegisterDto): Promise<AuthResponse> {
    try {
      const existingUser = await prisma.user.findFirst({
        where: { email: dto.email },
      });

      if (existingUser) {
        return {
          success: false,
          message: "User already exists",
          data: null
        };
      }

      const passwordHash = await hash(dto.password);

      const user = await prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          profile: {
            create: {
              firstName: dto.firstname,
              lastName: dto.lastname,
            },
          },
        },
        include: { profile: true },
      });

      // Générer les tokens initiaux
      const tokens = await TokenService.generateTokenPair(user.id);

      return {
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            status: user.status,
            role: user.role,
            profile: user.profile ? {
              id: user.profile.id,
              firstname: user.profile.firstName || undefined,
              lastname: user.profile.lastName || undefined
            } : undefined
          },
          tokens
        }
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: "Registration failed",
        data: null
      };
    }
  }

  static async login(ctx: Context, dto: LoginDto): Promise<AuthResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: dto.email },
        include: { profile: true },
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null
        };
      }

      if (user.status === "BLOCKED") {
        return {
          success: false,
          message: "User blocked",
          data: null
        };
      }

      const isPasswordValid = await verify(user.passwordHash, dto.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid password",
          data: null
        };
      }

      // Générer une nouvelle paire de tokens
      const tokens = await TokenService.generateTokenPair(user.id);

      // Configurer les cookies avec les nouveaux tokens
      ctx.cookies.set("access_token", tokens.accessToken, {
        ...AUTH_CONFIG.cookie,
        overwrite: true
      });

      ctx.cookies.set("refresh_token", tokens.refreshToken, {
        ...AUTH_CONFIG.cookie,
        overwrite: true
      });

      if (process.env.NODE_ENV === "development") {
        console.log("Cookies set:", {
          accessToken: tokens.accessToken.substring(0, 10) + "...",
          refreshToken: tokens.refreshToken.substring(0, 10) + "...",
          options: AUTH_CONFIG.cookie
        });
      }

      return {
        success: true,
        message: "User logged in successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            status: user.status,
            role: user.role,
            profile: user.profile ? {
              id: user.profile.id,
              firstname: user.profile.firstName || undefined,
              lastname: user.profile.lastName || undefined
            } : undefined
          },
          tokens
        }
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Login failed",
        data: null
      };
    }
  }

  static async logout(ctx: Context): Promise<AuthResponse> {
    try {
      const accessToken = ctx.cookies.get("access_token");
      const refreshToken = ctx.cookies.get("refresh_token");

      if (accessToken) {
        // Révoquer l'access token
        await TokenService.revokeToken(accessToken);
      }

      if (refreshToken) {
        // Révoquer le refresh token
        await TokenService.revokeToken(refreshToken);
      }

      // Supprimer les cookies
      ctx.cookies.set("access_token", "", {
        ...AUTH_CONFIG.cookie,
        maxAge: 0,
        expires: new Date(0)
      });

      ctx.cookies.set("refresh_token", "", {
        ...AUTH_CONFIG.cookie,
        maxAge: 0,
        expires: new Date(0)
      });

      return {
        success: true,
        message: "User logged out successfully",
        data: null
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Logout failed",
        data: null
      };
    }
  }

  // 2FA methods
  static async setup2FA(userId: string): Promise<{ qrCode: string; secret: string }> {
    const secret = authenticator.generateSecret();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    const otpauth = authenticator.keyuri(
      user!.email,
      "Daw Manager",
      secret
    );

    const qrCode = await QRCode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorStatus: "PENDING"
      }
    });

    return { qrCode, secret };
  }

  static async verify2FA(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true }
    });

    if (!user?.twoFactorSecret) return false;

    const isValid = authenticator.verify({
      token,
      secret: user.twoFactorSecret
    });

    if (isValid) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorStatus: "ACTIVE"
        }
      });

      await this.generateRecoveryCodes(userId);
    }

    return isValid;
  }

  private static async generateRecoveryCodes(userId: string, count = 10): Promise<void> {
    const codes = Array.from({ length: count }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    await prisma.$transaction([
      prisma.recoveryCode.deleteMany({
        where: { userId }
      }),
      prisma.recoveryCode.createMany({
        data: codes.map(code => ({
          userId,
          code: code
        }))
      })
    ]);
  }
}