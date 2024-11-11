import Router from "@koa/router";
import { RateLimitService } from "../../services/rate-limit.service";

export const rateLimitRoutes = new Router({ prefix: "/rate-limit" });

rateLimitRoutes.get("/status", async (ctx) => {
  const stats = await RateLimitService.getAttemptStats(ctx.ip);
  ctx.body = {
    success: true,
    data: stats
  };
});