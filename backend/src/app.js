import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { corsOrigins, env } from "./env.js";
import { ApiError } from "./lib/errors.js";
import { requireAuth } from "./middleware/auth.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { leaveRoutes, adminLeaveRoutes } from "./routes/leaves.js";
import { leaveTypeRoutes, holidayRoutes, orgRoutes, configRoutes } from "./routes/catalog.js";
import { attendanceRoutes, adminAttendanceRoutes } from "./routes/attendance.js";
import { employeeRoutes } from "./routes/employees.js";
import { overviewRoutes } from "./routes/overview.js";

// Postgres unique-constraint names → the form field they belong to.
const UNIQUE_FIELDS = {
  users_employee_code_uq: ["employeeCode", "That employee ID is already in use"],
  users_email_uq: ["email", "That email is already in use"],
  leave_types_code_unique: ["code", "That code is already in use"],
  holidays_date_unique: ["date", "There is already a holiday on that date"],
};

export function createApp() {
  const app = new Hono();

  if (env.NODE_ENV !== "test") app.use("*", logger());
  app.use("*", secureHeaders());
  app.use("*", cors({ origin: corsOrigins, allowHeaders: ["Authorization", "Content-Type"], maxAge: 600 }));
  app.use("*", bodyLimit({ maxSize: 512 * 1024, onError: (c) => c.json({ error: { message: "Payload too large" } }, 413) }));

  app.get("/", (c) => c.json({ name: "lasan-api", ok: true }));
  app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

  app.route("/auth", authRoutes);

  const api = new Hono();
  api.use("*", requireAuth);
  api.route("/me", meRoutes);
  api.route("/config", configRoutes);
  api.route("/leaves", leaveRoutes);
  api.route("/leave-types", leaveTypeRoutes);
  api.route("/holidays", holidayRoutes);
  api.route("/attendance", attendanceRoutes);
  api.route("/admin/overview", overviewRoutes);
  api.route("/admin/employees", employeeRoutes);
  api.route("/admin/leaves", adminLeaveRoutes);
  api.route("/admin/attendance", adminAttendanceRoutes);
  api.route("/admin/org", orgRoutes);
  app.route("/", api);

  app.notFound((c) => c.json({ error: { message: "Route not found", code: "not_found" } }, 404));

  app.onError((err, c) => {
    if (err instanceof ApiError) {
      return c.json({ error: { message: err.message, code: err.code, fields: err.fields } }, err.status);
    }
    const pg = err.cause ?? err;
    if (pg?.code === "23505") {
      const [field, message] = UNIQUE_FIELDS[pg.constraint_name] ?? [undefined, "That record already exists"];
      return c.json({ error: { message, code: "conflict", fields: field ? { [field]: message } : undefined } }, 409);
    }
    if (pg?.code === "23503") return c.json({ error: { message: "Referenced record does not exist", code: "bad_request" } }, 400);
    console.error(err);
    return c.json({ error: { message: "Something went wrong on our side", code: "internal" } }, 500);
  });

  return app;
}
