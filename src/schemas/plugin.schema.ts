import { z } from "zod";

export const pluginSchema = {
  create: z.object({
    name: z.string().min(3, "Le nom du plugin est requis"),
    vendor: z.string().min(3, "Le nom du vendeur est requis"),
    vendorUrl: z.string().optional(),
    category: z.string().min(3, "La catégorie du plugin est requise"),
    licenseKey: z.string().min(3, "La clé de licence du plugin est requise"),
    downloadUrl: z.string().url().optional(),
    purchaseEmail: z.string().email("L'email de la licence du plugin est requis"),
    purchasePassword: z.string().optional(),
    notes: z.string().optional(),
    version: z.string().optional(),
    purchaseDate: z.string().datetime().optional(),
    expirationDate: z.string().datetime().optional(),
  }),

  update: z.object({
    name: z.string().min(1).optional(),
    vendor: z.string().min(1).optional(),
    vendorUrl: z.string().url().optional(),
    category: z.string().optional(),
    licenseKey: z.string().min(1).optional(),
    downloadUrl: z.string().url().optional(),
    purchaseEmail: z.string().email().optional(),
    purchasePassword: z.string().optional(),
    notes: z.string().optional(),
    version: z.string().optional(),
    purchaseDate: z.string().datetime().optional(),
    expirationDate: z.string().datetime().optional(),
  }),

  updateInstallation: z.object({
    stepNumber: z.number().min(1).max(2),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]),
    notes: z.string().optional(),
  }),
} as const;

// Types d'export pour TypeScript
export type CreatePluginDto = z.infer<typeof pluginSchema.create>;
export type UpdatePluginDto = z.infer<typeof pluginSchema.update>;
export type UpdateInstallationDto = z.infer<typeof pluginSchema.updateInstallation>;