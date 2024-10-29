// src/routes/plugin.routes.ts
import Router from "@koa/router";
import { PluginController } from "@/controllers/plugin.controller.js";
import { authenticateToken } from "@/middlewares/auth.middleware.js";
import { checkRole } from "@/middlewares/checkRole.middleware.js";
export const pluginRoutes = new Router({ prefix: "/plugins" });

// Toutes les routes nécessitent une authentification
pluginRoutes.use(authenticateToken);

// Routes CRUD de base
pluginRoutes.post("/", checkRole(["ADMIN", "USER"]), ...PluginController.create);
pluginRoutes.get("/", checkRole(["ADMIN"]), ...PluginController.findAll);
pluginRoutes.get("/:id", checkRole(["ADMIN", "USER"]), ...PluginController.findOne);
pluginRoutes.patch("/:id", checkRole(["ADMIN", "USER"]), ...PluginController.update);
pluginRoutes.delete("/:id", checkRole(["ADMIN", "USER"]), ...PluginController.delete);

// Route spécifique pour la mise à jour des étapes d'installation
pluginRoutes.patch("/:id/installation", checkRole(["ADMIN", "USER"]), ...PluginController.updateInstallation);