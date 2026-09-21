import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../env.js";
import * as schema from "./schema.js";

function sslOption() {
  if (env.DATABASE_SSL === "require") return "require";
  if (env.DATABASE_SSL === "disable") return false;
  // Default: TLS for anything that isn't local or Railway's private network.
  const host = new URL(env.DATABASE_URL).hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".railway.internal") ? false : "require";
}

// *.railway.internal only resolves inside Railway; locally you need the public proxy URL.
if (new URL(env.DATABASE_URL).hostname.endsWith(".railway.internal") && !process.env.RAILWAY_ENVIRONMENT) {
  console.warn(
    "\n⚠ DATABASE_URL points at Railway's private network, which isn't reachable from this machine.\n" +
      "  For local runs use the Postgres service's DATABASE_PUBLIC_URL (…proxy.rlwy.net:PORT) instead.\n",
  );
}

export const sql = postgres(env.DATABASE_URL, {
  ssl: sslOption(),
  max: env.DATABASE_POOL_MAX,
  idle_timeout: 20,
  // Keep `date` columns as plain YYYY-MM-DD strings instead of JS Dates shifted by timezone.
  types: { date: { to: 1082, from: [1082], serialize: (v) => v, parse: (v) => v } },
});

export const db = drizzle(sql, { schema });
export { schema };
