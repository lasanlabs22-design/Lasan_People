import { serve } from "@hono/node-server";
import { env } from "./env.js";
import { createApp } from "./app.js";
import { sql } from "./db/client.js";

const server = serve({ fetch: createApp().fetch, port: env.PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`lasan-api listening on http://localhost:${info.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close();
    sql.end({ timeout: 5 }).finally(() => process.exit(0));
  });
}
