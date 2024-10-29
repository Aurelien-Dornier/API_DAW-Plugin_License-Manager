import { prisma } from "@/config/database.js";
import type { CreatePluginDto, UpdatePluginDto, UpdateInstallationDto } from "@/schemas/plugin.schema.js";
import type { Plugin, PluginInstallation } from "@prisma/client";

export class PluginService {
  static async create(userId: string, dto: CreatePluginDto): Promise<Plugin> {
    return await prisma?.$transaction(async (tx) => {
      /*
       * creer le plugin
       */
      const plugin = await tx.plugin.create({
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
          installations: {
            create: [
              {
                stepNumber: 1,
                stepTitle: "Telechargement",
                status: "PENDING",
              },
              {
                stepNumber: 2,
                stepTitle: "Installation",
                status: "PENDING",
              },
            ],
          },
        },
        include: {
          installations: true,
        },
      });
      return plugin;
    });
  }

  /**
   * * Mettre à jour un plugin
   */
  static async update(
    pluginId: string,
    userId: string,
    dto: UpdatePluginDto
  ): Promise<Plugin> {
    console.log("Starting update process...");
    console.log("Plugin ID:", pluginId);
    console.log("User ID:", userId);

    // Debug: Afficher les types
    console.log("Types:", {
      pluginIdType: typeof pluginId,
      userIdType: typeof userId,
      pluginIdValue: pluginId,
      userIdValue: userId,
    });

    // Vérifier si le plugin existe sans la condition userId d'abord
    const plugin = await prisma.plugin.findUnique({
      where: {
        id: pluginId,
      },
    });

    console.log("Found plugin:", plugin);

    if (!plugin) {
      throw new Error("Plugin non trouvé");
    }

    if (plugin.userId !== userId) {
      throw new Error("Non autorisé à modifier ce plugin");
    }

    /*
     * Créer l'objet de mise à jour
     */
    const updateData: Partial<Plugin> = {};

    // Ajouter uniquement les champs qui sont présents dans le DTO
    if (dto.name !== undefined) updateData["name"] = dto.name;
    if (dto.vendor !== undefined) updateData["vendor"] = dto.vendor;
    if (dto.vendorUrl !== undefined) updateData["vendorUrl"] = dto.vendorUrl;
    if (dto.category !== undefined) updateData["category"] = dto.category;
    if (dto.licenseKey !== undefined) updateData["licenseKey"] = dto.licenseKey;
    if (dto.downloadUrl !== undefined)
      updateData["downloadUrl"] = dto.downloadUrl;
    if (dto.purchaseEmail !== undefined)
      updateData["purchaseEmail"] = dto.purchaseEmail;
    if (dto.purchasePassword !== undefined)
      updateData["purchasePassword"] = dto.purchasePassword;
    if (dto.notes !== undefined) updateData["notes"] = dto.notes;
    if (dto.version !== undefined) updateData["version"] = dto.version;
    if (dto.purchaseDate !== undefined)
      updateData["purchaseDate"] = new Date(dto.purchaseDate);
    if (dto.expirationDate !== undefined)
      updateData["expirationDate"] = new Date(dto.expirationDate);

    console.log("Update data:", updateData);

    try {
      // Effectuer la mise à jour
      const updatedPlugin = await prisma.plugin.update({
        where: {
          id: pluginId,
        },
        data: updateData,
        include: {
          installations: {
            orderBy: {
              stepNumber: "asc",
            },
          },
        },
      });

      console.log("Update successful:", updatedPlugin);
      return updatedPlugin;
    } catch (error: any) {
      console.error("Update failed:", error);
      throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  }

  /**
   * Mettre à jour une étape d'installation
   */
  static async updateInstallationStep(
    pluginId: string,
    userId: string,
    dto: UpdateInstallationDto
  ): Promise<PluginInstallation> {
    console.log("Starting installation update...");
    console.log("Plugin ID:", pluginId);
    console.log("User ID:", userId);
    console.log("DTO:", dto);

    // Vérifier si le plugin existe
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

    try {
      // Mise à jour de l'étape d'installation
      const updatedStep = await prisma.pluginInstallation.update({
        where: {
          pluginId_stepNumber: {
            pluginId: pluginId,
            stepNumber: dto.stepNumber,
          },
        },
        data: {
          status: dto.status,
          notes: dto.notes,
          completedAt: dto.status === "COMPLETED" ? new Date() : null,
        },
      });

      console.log("Installation step updated:", updatedStep);
      return updatedStep;
    } catch (error: any) {
      console.error("Installation update failed:", error);
      throw new Error(
        `Erreur lors de la mise à jour de l'installation: ${error.message}`
      );
    }
  }

  /**
   * * Récupérer un plugin avec ses étapes d'installation
   */
  static async findOne(
    pluginId: string,
    userId: string
  ): Promise<Plugin | null> {
    await this.checkPluginOwnership(pluginId, userId);

    return await prisma.plugin.findUnique({
      where: { id: pluginId },
      include: {
        installations: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });
  }

  /**
   * * liste des plugins d'un utilisateur
   */
  static async findAll(userId: string): Promise<Plugin[]> {
    return await prisma.plugin.findMany({
      where: { userId },
      include: {
        installations: {
          orderBy: { stepNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * * supprimer un plugin
   */
  static async delete(pluginId: string, userId: string): Promise<void> {
    await this.checkPluginOwnership(pluginId, userId);
    await prisma.plugin.delete({
      where: { id: pluginId },
    });
  }

  /**
   * * verifier si l'utilisateur est le proprietaire du plugin
   */
  private static async checkPluginOwnership(
    pluginId: string,
    userId: string
  ): Promise<void> {
    const plugin = await prisma?.plugin.findUnique({
      where: { id: pluginId },
      select: { userId: true },
    });

    if (!plugin || plugin.userId !== userId) {
      throw new Error("Vous n'avez pas le droit de modifier ce plugin");
    }
  }
}
