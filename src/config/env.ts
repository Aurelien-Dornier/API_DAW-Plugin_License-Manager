import { z } from "zod";
import dotenv from "dotenv";

// Charger les variables d'environnement avec le résultat
const dotenvResult = dotenv.config();

// Vérifier si .env a été chargé correctement
if (dotenvResult.error) {
  console.error("❌ Error loading .env file:", dotenvResult.error.message);
  process.exit(1);
}

const envSchema = z.object({
  /* Base variables */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("3000")
    .transform((val) => {
      const port = parseInt(val, 10);
      if (isNaN(port)) throw new Error("PORT must be a number");
      return port;
    }),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  ALLOWED_ORIGINS: z
  .string()
  .default("http://localhost:5173")
  .transform((val) => {
    const origins = val.split(",").map((origin) => origin.trim());
    // verifie si urls valides
    origins.forEach((origin) => {
      try {
        new URL (origin);
      } catch (error) {
        throw new Error(`invalid URL in ALLOWED_ORIGINS: ${origin}`)
      }
    });
    return origins;
  }),
  /* Auth related variables */
  JWT_SECRET: z.string().min(32, "JWT_SECRET should be at least 32 characters"),
  JWT_EXPIRES_IN: z
    .string()
    .default("7d")
    .refine((val) => /^\d+[dhms]$/.test(val), {
      message: "JWT_EXPIRES_IN must be in format: 1d, 12h, 30m, or 60s",
    }),
  COOKIE_MAX_AGE: z
    .string()
    .default("86400000")
    .transform((val) => {
      const ms = parseInt(val, 10);
      if (isNaN(ms)) throw new Error("COOKIE_MAX_AGE must be a number");
      return ms;
    }),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET should be at least 32 characters"),
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY should be at least 32 characters"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("\n❌ Invalid environment variables");

  const errorFormat = _env.error.format();
  Object.entries(errorFormat).forEach(([key, value]) => {
    if (value && typeof value === "object" && "_errors" in value) {
      const errors = value._errors;
      if (errors.length > 0) {
        console.error(`\n${key}:`);
        errors.forEach((err: string) => console.error(`  - ${err}`));
      }
    }
  });

  // Messages d'aide en développement
  if (process.env.NODE_ENV !== "production") {
    console.error("\n📝 Required variables example:");
    console.error(`
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
JWT_SECRET=your-super-secret-key-at-least-32-chars-long
JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE=86400000
SESSION_SECRET=another-secret-key-at-least-32-chars-long
ENCRYPTION_KEY=encryption-key-at-least-32-chars-long
    `);

    console.error("\n💡 Current .env file path:", process.cwd() + "/.env");
  }

  process.exit(1);
}

export const env = _env.data;
export type Env = typeof env;

// Feedback en développement
if (process.env.NODE_ENV !== "production") {
  console.log("\n✅ Environment variables validated and loaded");
  console.log("\n📌 Current configuration:");
  console.log({
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    DATABASE_URL: env.DATABASE_URL.replace(/\/\/.*@/, "//***:***@"),
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
    COOKIE_MAX_AGE: env.COOKIE_MAX_AGE,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
  });
}
