import Router from "@koa/router";
import { PluginController } from "../../controllers/plugin.controller";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { checkRole } from "../../middlewares/checkRole.middleware";
export const pluginRoutes = new Router({ prefix: "/plugins" });

// Toutes les routes nécessitent une authentification
pluginRoutes.use(authenticateToken);
// Routes supplémentaires
pluginRoutes.get("/categories", checkRole(["ADMIN", "USER"]), ...PluginController.findAllCategories);

// Routes CRUD de base
pluginRoutes.post("/", checkRole(["ADMIN", "USER"]), ...PluginController.create);
pluginRoutes.get("/", checkRole(["ADMIN", "USER"]), ...PluginController.findAll);
pluginRoutes.get("/:id", checkRole(["ADMIN", "USER"]), ...PluginController.findOne);
pluginRoutes.patch("/:id", checkRole(["ADMIN", "USER"]), ...PluginController.update);
pluginRoutes.delete("/:id", checkRole(["ADMIN", "USER"]), ...PluginController.delete);

