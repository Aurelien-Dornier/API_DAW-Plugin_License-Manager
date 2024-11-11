import { Context, Next } from "koa";

export const contentTypeCheck = async (ctx: Context, next: Next): Promise<void> => {
  // Liste des routes qui ne nécessitent pas de corps JSON
  const exemptRoutes: string[] = ["/auth/logout"];

  // Vérifie si la route actuelle est exemptée ou si c'est une requête GET
  if (exemptRoutes.includes(ctx.path) || ctx.method === "GET") {
    return await next();
  }

  // Pour les autres routes, vérifie si le type de contenu est JSON quand il y a un corps de requête
  if (ctx.request.body && 
      Object.keys(ctx.request.body).length > 0 && 
      !ctx.is("application/json")) {
    ctx.throw(415, "Le type de contenu doit être application/json");
  }

  await next();
};