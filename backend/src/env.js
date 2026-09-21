import dotenv from "dotenv";
dotenv.config({ quiet: true });
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Railway's public proxy needs TLS; the private network (*.railway.internal) does not.
  DATABASE_SSL: z.enum(["require", "disable"]).optional(),
  // Railway's free Postgres allows ~20 connections; keep headroom for migrations and studio.
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_TTL: z.string().default("7d"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:\n" + parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
