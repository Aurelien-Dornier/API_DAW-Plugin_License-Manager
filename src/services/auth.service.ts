import { prisma } from "@/config/database.js";
import { hash, verify } from "argon2";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import type { Context } from "koa";
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  JWTTPayload,
} from "@/types/auth.types.js";
import { AUTH_CONFIG } from "@/config/auth.config.js";

export class AuthService {

 
  /**
   * @description enregistrer un utilisateur
   * @static
   * @param {RegisterDto} dto
   * @return {*}  {Promise<AuthResponse>}
   * @memberof AuthService
   */
  static async register(dto: RegisterDto): Promise<AuthResponse> {
    try {
      const existingUser = await prisma.user.findFirst({
        where: { email: dto.email },
      });

      if (existingUser) {
        return {
          success: false,
          message: "User already exists",
        };
      }

      // * hash the password
      const passwordHash = await hash(dto.password);

      // * create the user
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

      // * generate the token
      const accessToken = this.generateToken({ userId: user.id, type: "ACCESS" });
      
      return {
        success: true,
        message: "User registered successfully",
        data: {
          accessToken,
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
          }
        }
      };
    } catch (error ) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: "Registration failed"
      };
    }
  }

  /**
   * @description connexion d'un utilisateur
   */
  static async login(ctx: Context, dto: LoginDto): Promise<AuthResponse> {
    try {
      // * rechercher l'user par email
      const user = await prisma.user.findUnique({
        where: { email: dto.email },
        include: { profile: true },
      });

      // * si pas d'user trouvé
      if (!user) {
        return {
          success: false,
          message: "User not found"
        }
      }

      // * verifier le status de l'user
      if (user.status === "BLOCKED") {
        return {
          success: false,
          message: "User blocked"
        }
      }

      // * verifier le mot de passe
      const isPasswordValid = await verify(user.passwordHash, dto.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid password"
        }
      }

      // * calculer la date d'expiration correctement
      const expiresInMs = parseInt(AUTH_CONFIG.jwt.expiresIn.replace(/[dhms]/g, '')) * 24 * 60 * 60 * 1000; // Convertit "1d" en millisecondes
      const expiresAt = new Date(Date.now() + expiresInMs);

      // * creer une session avec la bonne date d'expiration
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: "",
          ipAddress: ctx.ip,
          userAgent: ctx.get("user-agent"),
          expiresAt: expiresAt,
        }
      });

      // * generer le token
      const accessToken = this.generateToken({ userId: user.id, type: "ACCESS" });

      // * Mettre à jour la date de dernière connexion
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // * mettre à jour la session avec le token
      await prisma.session.update({
        where: { id: session.id },
        data: { token: accessToken },
      });

      // * definir le cookie 
      ctx.cookies.set("access_token", accessToken, AUTH_CONFIG.cookie);

      return {
        success: true,
        message: "User logged in successfully",
        data: {
          accessToken,
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
          }
        }
      };

    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Login failed"
      };
    }
  }

  /**
   * @description deconnexion d'un utilisateur
   * @static
   * @param {Context} ctx
   * @return {*}  {Promise<AuthResponse>}
   * @memberof AuthService
   */
  static async logout(ctx: Context): Promise<AuthResponse> {
    try {
      const token = ctx.cookies.get("access_token");
      if(token) {
        await prisma.session.deleteMany({
          where: { token }
        });
        // * Suppression du cookie
        ctx.cookies.set("access_token", "", {
          ...AUTH_CONFIG.cookie,
          maxAge: 0, //! force l'expiration immédiate
          expires: new Date(0) // ? ajouter une date dans le passé
        });
      }
      return {
        success: true,
        message: "User logged out successfully"
      }
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Logout failed"
      }
    }

  }

  /**
   * @description configuration double authentification
   */
  static async setup2FA(userId: string): Promise<{ qrCode: string; secret: string }> {
    // * generer le secret
    const secret = authenticator.generateSecret();
    // * rechercher l'user par id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    // * generer le code QR
    const otpauth = authenticator.keyuri(
      user!.email,
      "YourAppName",
      secret
    );

    const qrCode = await QRCode.toDataURL(otpauth);

    // * mettre à jour l'utilisateur avec le secret
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorStatus: "PENDING"
      }
    });

    return { qrCode, secret };
  }

  /**
   * @description verification double authentification
   */
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
      // Activer 2FA si c'était en attente
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorStatus: "ACTIVE"
        }
      });

      // Générer des codes de récupération si nécessaire
      await this.generateRecoveryCodes(userId);
    }

    return isValid;
  }

 
  /**
   * @description generation des codes de recuperation
   * @private
   * @static
   * @param {string} userId
   * @param {number} [count=10]
   * @return {*}  {Promise<void>}
   * @memberof AuthService
   */
  private static async generateRecoveryCodes(userId: string, count = 10): Promise<void> {
    const codes = Array.from({ length: count }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    await prisma.$transaction([
      // * supprimer les anciens codes
      prisma.recoveryCode.deleteMany({
        where: { userId }
      }),
      // * creer les nouveaux codes
      prisma.recoveryCode.createMany({
        data: codes.map(code => ({
          userId,
          code: code
        }))
      })
    ]);
  }


  /**
   * @description generer un token
   * @private
   * @static
   * @param {JWTTPayload} payload
   * @return {*}  {string}
   * @memberof AuthService
   */
  private static generateToken(payload: JWTTPayload): string {
    return jwt.sign(payload, AUTH_CONFIG.jwt.secret, 
    { expiresIn: AUTH_CONFIG.jwt.expiresIn });
  }
}
