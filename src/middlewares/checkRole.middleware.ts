import type { Context, Next } from "koa";

export const checkRole = (allowedRoles: string[]) => async (ctx: Context, next: Next) => {
  if (!allowedRoles.includes(ctx.state.user.role)) {
    ctx.status = 403;
    ctx.body = { success: false, message: "Accès non autorisé" };
    return;
  }
  await next();
};

