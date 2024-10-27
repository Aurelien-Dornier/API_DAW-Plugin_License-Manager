import type { Context, Next } from "koa";
import { z } from "zod";

export const validate = (schema: z.ZodSchema) => async (ctx: Context, next: Next) => {
  try {
    ctx.request.body = schema.parse(ctx.request.body);
    return await next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "Validation failed",
        errors: error.errors
      };
      return;
    }
    throw error;
  }
};