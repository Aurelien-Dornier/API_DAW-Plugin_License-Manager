import type { Context } from "koa";
import { PluginService } from "../services/plugin.service";
import { pluginSchema } from "../schemas/plugin.schema";
import { validate } from "../schemas/validate.middleware";
import type { CreatePluginDto, UpdatePluginDto } from "../schemas/plugin.schema";

export const PluginController = {
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

  update: [
    validate(pluginSchema.update),
    async (ctx: Context) => {
      try {
        const plugin = await PluginService.update(
          ctx.params.id.toString(),
          ctx.state.user.id.toString(),
          ctx.request.body as UpdatePluginDto
        );

        ctx.body = {
          success: true,
          message: "Plugin mis à jour avec succès",
          data: plugin
        };
      } catch (error: any) {
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