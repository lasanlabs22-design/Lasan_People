import { Hono } from "hono";
import { z } from "zod";
import { eq, or, sql } from "drizzle-orm";
import { db, schema } from "../db/client.js";
import { signToken, verifyPassword, hashPassword, publicUser } from "../lib/auth.js";
import { badRequest, unauthorized, forbidden } from "../lib/errors.js";
import { password } from "../lib/validators.js";
import { audit } from "../lib/audit.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { rateLimit, clientIp } from "../middleware/rate-limit.js";

const { users, profiles } = schema;
export const authRoutes = new Hono();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  key: async (c) => {
    const body = await c.req.raw.clone().json().catch(() => ({}));
    return `${String(body.identifier ?? "").toLowerCase()}|${clientIp(c)}`;
  },
});

authRoutes.post(
  "/login",
  loginLimiter,
  validate("json", z.object({ identifier: z.string().trim().min(1, "Required"), password: z.string().min(1, "Required") })),
  async (c) => {
    const { identifier, password: plain } = c.req.valid("json");
    const id = identifier.toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(sql`lower(${users.email})`, id), eq(sql`lower(${users.employeeCode})`, id)));

    // Same message for unknown user and wrong password so accounts can't be enumerated.
    if (!user || !(await verifyPassword(plain, user.passwordHash))) throw unauthorized("Invalid ID or password");
    if (user.status !== "active") throw forbidden("Your access has been revoked. Contact your administrator.");

    const [updated] = await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id)).returning();
    await audit(user.id, "auth.login", "user", user.id);
    return c.json({ token: await signToken(updated), user: publicUser(updated) });
  },
);

authRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  const [profile] = await db
    .select({ avatar: profiles.avatar })
    .from(profiles)
    .where(eq(profiles.userId, user.id));
  return c.json({ user: { ...publicUser(user), avatar: profile?.avatar ?? null } });
});

authRoutes.post(
  "/change-password",
  requireAuth,
  validate("json", z.object({ currentPassword: z.string().min(1, "Required"), newPassword: password })),
  async (c) => {
    const user = c.get("user");
    const { currentPassword, newPassword } = c.req.valid("json");
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw badRequest("Current password is incorrect", { currentPassword: "Current password is incorrect" });
    }
    if (currentPassword === newPassword) {
      throw badRequest("Choose a password you haven't used here", { newPassword: "Must differ from the current password" });
    }

    const [updated] = await db
      .update(users)
      .set({
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
        tokenVersion: user.tokenVersion + 1,
      })
      .where(eq(users.id, user.id))
      .returning();
    await audit(user.id, "auth.password_changed", "user", user.id);
    // Old tokens are now invalid; hand back a fresh one.
    return c.json({ token: await signToken(updated), user: publicUser(updated) });
  },
);

authRoutes.post("/logout-all", requireAuth, async (c) => {
  // Signs out every device by rotating the token version.
  const user = c.get("user");
  await db.update(users).set({ tokenVersion: user.tokenVersion + 1 }).where(eq(users.id, user.id));
  return c.json({ ok: true });
});
