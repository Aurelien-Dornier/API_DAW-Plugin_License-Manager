// src/routes/plugin.routes.ts
import Router from "@koa/router";
import { PluginController } from "@/controllers/plugin.controller.js";
import { authenticateToken } from "@/middlewares/auth.middleware.js";

export const pluginRoutes = new Router({ prefix: "/plugins" });

// Toutes les routes nécessitent une authentification
pluginRoutes.use(authenticateToken);

// Routes CRUD de base
pluginRoutes.post("/", ...PluginController.create);
pluginRoutes.get("/", ...PluginController.findAll);
pluginRoutes.get("/:id", ...PluginController.findOne);
pluginRoutes.patch("/:id", ...PluginController.update);
pluginRoutes.delete("/:id", ...PluginController.delete);

// Route spécifique pour la mise à jour des étapes d'installation
pluginRoutes.patch("/:id/installation", ...PluginController.updateInstallation);