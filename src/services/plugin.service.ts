import { prisma } from "../config/database";
import type { CreatePluginDto, UpdatePluginDto } from "../schemas/plugin.schema";
import type { Plugin } from "@prisma/client";

export class PluginService {
  static async create(userId: string, dto: CreatePluginDto): Promise<Plugin> {
    return await prisma.plugin.create({
      data: {
        userId,
        name: dto.name,
        vendor: dto.vendor,
        vendorUrl: dto.vendorUrl,
        category: dto.category,
        licenseKey: dto.licenseKey,
        downloadUrl: dto.downloadUrl,
        purchaseEmail: dto.purchaseEmail,
        purchasePassword: dto.purchasePassword,
        notes: dto.notes,
        version: dto.version,
        purchaseDate: dto.purchaseDate,
        expirationDate: dto.expirationDate,
        status: dto.status || 'NOT_INSTALLED'
      }
    });
  }

  static async update(
    pluginId: string,
    userId: string,
    dto: UpdatePluginDto
  ): Promise<Plugin> {
    console.log("Starting update process...");
    console.log("Plugin ID:", pluginId);
    console.log("User ID:", userId);

    const plugin = await prisma.plugin.findUnique({
      where: {
        id: pluginId,
      },
    });

    if (!plugin) {
      throw new Error("Plugin non trouvé");
    }

    if (plugin.userId !== userId) {
      throw new Error("Non autorisé à modifier ce plugin");
    }

    const updateData: Partial<Plugin> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.vendor !== undefined) updateData.vendor = dto.vendor;
    if (dto.vendorUrl !== undefined) updateData.vendorUrl = dto.vendorUrl;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.licenseKey !== undefined) updateData.licenseKey = dto.licenseKey;
    if (dto.downloadUrl !== undefined) updateData.downloadUrl = dto.downloadUrl;
    if (dto.purchaseEmail !== undefined) updateData.purchaseEmail = dto.purchaseEmail;
    if (dto.purchasePassword !== undefined) updateData.purchasePassword = dto.purchasePassword;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.version !== undefined) updateData.version = dto.version;
    if (dto.purchaseDate !== undefined) updateData.purchaseDate = new Date(dto.purchaseDate);
    if (dto.expirationDate !== undefined) updateData.expirationDate = new Date(dto.expirationDate);
    if (dto.status !== undefined) updateData.status = dto.status;

    try {
      return await prisma.plugin.update({
        where: { id: pluginId },
        data: updateData
      });
    } catch (error: any) {
      console.error("Update failed:", error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  }

  static async findOne(
    pluginId: string,
    userId: string
  ): Promise<Plugin | null> {
    await this.checkPluginOwnership(pluginId, userId);
    return await prisma.plugin.findUnique({
      where: { id: pluginId }
    });
  }

  static async findAll(userId: string): Promise<Plugin[]> {
    return await prisma.plugin.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  static async delete(pluginId: string, userId: string): Promise<void> {
    await this.checkPluginOwnership(pluginId, userId);
    await prisma.plugin.delete({
      where: { id: pluginId }
    });
  }

  private static async checkPluginOwnership(
    pluginId: string,
    userId: string
  ): Promise<void> {
    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId },
      select: { userId: true }
    });

    if (!plugin || plugin.userId !== userId) {
      throw new Error("Vous n'avez pas le droit de modifier ce plugin");
    }
  }
}