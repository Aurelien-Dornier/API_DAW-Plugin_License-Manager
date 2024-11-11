import type { Context } from "koa";
import { AuthService } from "../services/auth.service";
import { loginRateLimit } from "../middlewares/rate-limit.middleware";
import { validate } from "../schemas/validate.middleware";
import { authSchema } from "../schemas/auth.schema";
import type {
  RegisterDto,
  LoginDto,
  Verify2FADto,
} from "../types/auth.types";
import { prisma } from "../config/database";

export const AuthController = {
  /**
   * Route d'inscription
   */
  register: [
    validate(authSchema.register),
    async (ctx: Context) => {
      const response = await AuthService.register(
        ctx.request.body as RegisterDto
      );
      console.log(response);
      ctx.status = response.success ? 201 : 400;
      ctx.body = response;
    },
  ],
  /**
   * Rpute pour recuperer un user.
   */
  me: [
  
    async (ctx: Context) => {
      const response = await AuthService.fetchUser(ctx.state.user.id);
      ctx.status = response.success ? 200 : 400;
      ctx.body = response;
    },
  ],

  /**
   * Route de connexion
   */
  login: [
    validate(authSchema.login),
    loginRateLimit, // ? middleware de limitation de connexion
    async (ctx: Context) => {
      const response = await AuthService.login(
        ctx,
        ctx.request.body as LoginDto
      );
      console.log("response API LOGIN", response);
      ctx.status = response.success ? 200 : 401;
      ctx.body = response;
    },
  ],

  /**
   * Route de déconnexion
   */
  logout: [
    async (ctx: Context) => {
      const response = await AuthService.logout(ctx);
      ctx.status = response.success ? 200 : 500;
      ctx.body = response;
    },
  ],

  /**
   * Route de configuration 2FA
   */
  setup2FA: [
    async (ctx: Context) => {
      try {
        const { qrCode, secret } = await AuthService.setup2FA(
          ctx.state.user.id
        );
        ctx.body = { success: true, data: { qrCode, secret } };
      } catch (error) {
        ctx.status = 500;
        ctx.body = { success: false, message: "Failed to setup 2FA" };
      }
    },
  ],

  /**
   * Route de vérification 2FA
   */
  verify2FA: [
    validate(authSchema.verify2FA),
    async (ctx: Context) => {
      const { token } = ctx.request.body as Verify2FADto;
      const isValid = await AuthService.verify2FA(ctx.state.user.id, token);
      if (isValid) {
        ctx.body = { success: true, message: "2FA verified successfully" };
      } else {
        ctx.status = 400;
        ctx.body = { success: false, message: "Invalid 2FA token" };
      }
    },
  ],

  /**
   * Route pour vérifier le status 2FA
   */
  check2FAStatus: [
    async (ctx: Context) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: ctx.state.user.id },
          select: {
            twoFactorStatus: true,
            email: true,
          },
        });

        ctx.body = {
          success: true,
          data: {
            twoFactorStatus: user?.twoFactorStatus,
            email: user?.email,
          },
        };
      } catch (error) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: "Failed to check 2FA status",
        };
      }
    },
  ],
};
