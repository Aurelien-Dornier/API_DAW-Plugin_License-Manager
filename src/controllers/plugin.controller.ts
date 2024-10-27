import type { Context } from "koa";
import { PluginService } from "@/services/plugin.service.js";
import { pluginSchema } from "@/schemas/plugin.schema.js";
import { validate } from "@/schemas/validate.middleware.js";
import type {CreatePluginDto, UpdatePluginDto, UpdateInstallationDto,} from "@/schemas/plugin.schema.js";

export const PluginController = {
  /**
   * * Créer un plugin
   */
  create: [
    validate(pluginSchema.create),
    async (ctx: Context) => {
      try {
        const plugin = await PluginService.create(
          ctx.state.user.id,
          ctx.request.body as CreatePluginDto
        );
        ctx.status = 201;
        ctx.body = {
          success: true,
          message: "Plugin créé avec succès",
          data: plugin,
        };
      } catch (error) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: "Une erreur est survenue lors de la création du plugin",
        };
      }
    },
  ],

  /**
   * * Mettre à jour un plugin
   */
  update: [
    validate(pluginSchema.update),
    async (ctx: Context) => {
      try {
        console.log('Update request:', {
          params: ctx.params,
          body: ctx.request.body,
          user: ctx.state.user
        });

        const plugin = await PluginService.update(
          ctx.params.id.toString(), // Assurer que l'ID est une chaîne
          ctx.state.user.id.toString(), // Assurer que l'ID utilisateur est une chaîne
          ctx.request.body as UpdatePluginDto
        );

        ctx.body = {
          success: true,
          message: "Plugin mis à jour avec succès",
          data: plugin
        };
      } catch (error: any) {
        console.error('Controller error:', error);
        ctx.status = error.message?.includes("non trouvé") ? 404 : 
                    error.message?.includes("non autorisé") ? 403 : 500;
        ctx.body = {
          success: false,
          message: error.message,
          error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
      }
    }
  ],

  /**
   * * Mettre à jour une étape d'installation
   */
  updateInstallation: [
    validate(pluginSchema.updateInstallation),
    async (ctx: Context) => {
      try {
        console.log('Update installation request:', {
          params: ctx.params,
          body: ctx.request.body,
          user: ctx.state.user
        });

        const installation = await PluginService.updateInstallationStep(
          ctx.params.id.toString(), // Assurer que l'ID est une chaîne
          ctx.state.user.id.toString(), // Assurer que l'ID utilisateur est une chaîne
          ctx.request.body as UpdateInstallationDto
        );

        ctx.body = {
          success: true,
          message: "Étape d'installation mise à jour avec succès",
          data: installation
        };
      } catch (error: any) {
        console.error('Controller error:', error);
        ctx.status = error.message?.includes("non trouvé") ? 404 : 
                    error.message?.includes("non autorisé") ? 403 : 500;
        ctx.body = {
          success: false,
          message: error.message,
          error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
      }
    }
  ],


  /**
   * * Récupérer un plugin spécifique
   */
  findOne: [
    async (ctx: Context) => {
      try {
        const plugin = await PluginService.findOne(
          ctx.params.id,
          ctx.state.user.id
        );

        if (!plugin) {
          ctx.status = 404;
          ctx.body = {
            success: false,
            message: "Plugin not found",
          };
          return;
        }

        ctx.body = {
          success: true,
          data: plugin,
        };
      } catch (error) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: "Failed to retrieve plugin",
        };
      }
    },
  ],

  /**
   * * Lister tous les plugins
   */
  findAll: [
    async (ctx: Context) => {
      try {
        const plugins = await PluginService.findAll(ctx.state.user.id);

        ctx.body = {
          success: true,
          data: plugins,
        };
      } catch (error) {
        ctx.status = 500;
        ctx.body = {
          success: false,
          message: "Failed to retrieve plugins",
        };
      }
    },
  ],

  /**
   * * Supprimer un plugin
   */
  delete: [
    async (ctx: Context) => {
      try {
        await PluginService.delete(ctx.params.id, ctx.state.user.id);

        ctx.body = {
          success: true,
          message: "Plugin deleted successfully",
        };
      } catch (error: any) {
        ctx.status = error.message?.includes("not found") ? 404 : 500;
        ctx.body = {
          success: false,
          message: error.message || "Failed to delete plugin",
        };
      }
    },
  ],
};
