import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client.js";
import { verifyToken } from "../lib/auth.js";
import { forbidden, unauthorized, ApiError } from "../lib/errors.js";

// Routes a user may hit while still holding a first-login / reset password.
const PASSWORD_CHANGE_ALLOWED = new Set(["/auth/me", "/auth/change-password"]);

/**
 * Verifies the bearer token, then re-loads the user so revocation and password
 * changes take effect immediately (token version must match the database).
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw unauthorized();

  const payload = await verifyToken(token);
  if (!payload?.sub) throw unauthorized("Session expired, please sign in again");

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub));
  if (!user || user.tokenVersion !== payload.tv) throw unauthorized("Session expired, please sign in again");
  if (user.status !== "active") throw forbidden("Your access has been revoked. Contact your administrator.");

  if (user.mustChangePassword && !PASSWORD_CHANGE_ALLOWED.has(c.req.path)) {
    throw new ApiError(403, "You must change your password before continuing", "password_change_required");
  }

  c.set("user", user);
  await next();
});

export const requireRole = (...roles) =>
  createMiddleware(async (c, next) => {
    if (!roles.includes(c.get("user")?.role)) throw forbidden();
    await next();
  });
