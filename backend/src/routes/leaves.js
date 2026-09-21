import { Hono } from "hono";
import { z } from "zod";
import { and, eq, gte, lte, inArray, desc, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, schema } from "../db/client.js";
import { countLeaveDays, isEligible, leaveBalances } from "../lib/leave.js";
import { todayIn, yearRange } from "../lib/dates.js";
import { badRequest, conflict, notFound } from "../lib/errors.js";
import { isoDate, optionalText, uuidParam, yearQuery } from "../lib/validators.js";
import { audit } from "../lib/audit.js";
import { requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const { leaveRequests, leaveTypes, users } = schema;
const reviewers = alias(users, "reviewer");

/** Shared select for leave rows with type + reviewer info joined in. */
export function leaveQuery() {
  return db
    .select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      halfDay: leaveRequests.halfDay,
      days: leaveRequests.days,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      reviewComment: leaveRequests.reviewComment,
      reviewedAt: leaveRequests.reviewedAt,
      createdAt: leaveRequests.createdAt,
      leaveType: {
        id: leaveTypes.id,
        code: leaveTypes.code,
        name: leaveTypes.name,
        color: leaveTypes.color,
        countsCalendarDays: leaveTypes.countsCalendarDays,
      },
      employee: { id: users.id, name: users.name, employeeCode: users.employeeCode, gender: users.gender },
      reviewerName: reviewers.name,
    })
    .from(leaveRequests)
    .innerJoin(leaveTypes, eq(leaveTypes.id, leaveRequests.leaveTypeId))
    .innerJoin(users, eq(users.id, leaveRequests.userId))
    .leftJoin(reviewers, eq(reviewers.id, leaveRequests.reviewerId));
}

const applySchema = z
  .object({
    leaveTypeId: z.uuid("Choose a leave type"),
    startDate: isoDate,
    endDate: isoDate,
    halfDay: z.enum(["none", "first_half", "second_half"]).default("none"),
    reason: z.string().trim().min(3, "Tell your admin briefly why").max(1000),
  })
  .refine((v) => v.endDate >= v.startDate, { path: ["endDate"], message: "End date must be on or after start date" })
  .refine((v) => v.startDate.slice(0, 4) === v.endDate.slice(0, 4), {
    path: ["endDate"],
    message: "A request can't cross into a new year — split it into two",
  })
  .refine((v) => v.halfDay === "none" || v.startDate === v.endDate, {
    path: ["halfDay"],
    message: "Half day leave must start and end on the same date",
  });

async function validateRequest(user, input) {
  const [type] = await db.select().from(leaveTypes).where(eq(leaveTypes.id, input.leaveTypeId));
  if (!type || !type.isActive) throw badRequest("Unknown leave type", { leaveTypeId: "Choose a leave type" });
  if (!isEligible(type, user.gender)) throw badRequest(`${type.name} isn't available for your profile`, { leaveTypeId: "Not eligible" });
  if (input.halfDay !== "none" && !type.allowHalfDay) throw badRequest(`${type.name} can't be taken as a half day`, { halfDay: "Not allowed" });

  const days = await countLeaveDays(type, input.startDate, input.endDate, input.halfDay);
  if (days <= 0) throw badRequest("Those dates are all weekends or holidays", { startDate: "No working days selected" });

  const year = Number(input.startDate.slice(0, 4));
  const balance = (await leaveBalances(user, year)).find((b) => b.leaveTypeId === type.id);
  return { type, days, balance };
}

export const leaveRoutes = new Hono();

leaveRoutes.get("/balances", validate("query", z.object({ year: yearQuery.optional() })), async (c) => {
  const year = c.req.valid("query").year ?? Number(todayIn().slice(0, 4));
  return c.json({ year, balances: await leaveBalances(c.get("user"), year) });
});

// Dry-run so the UI can show "this will use N days" before submitting.
leaveRoutes.post("/preview", validate("json", applySchema), async (c) => {
  const { days, balance } = await validateRequest(c.get("user"), c.req.valid("json"));
  return c.json({ days, available: balance?.available ?? 0, sufficient: days <= (balance?.available ?? 0) });
});

leaveRoutes.get("/mine", validate("query", z.object({ year: yearQuery.optional() })), async (c) => {
  const user = c.get("user");
  const year = c.req.valid("query").year ?? Number(todayIn().slice(0, 4));
  const { start, end } = yearRange(year);
  const leaves = await leaveQuery()
    .where(and(eq(leaveRequests.userId, user.id), gte(leaveRequests.startDate, start), lte(leaveRequests.startDate, end)))
    .orderBy(desc(leaveRequests.startDate));
  return c.json({ year, leaves });
});

leaveRoutes.post("/", validate("json", applySchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const { type, days, balance } = await validateRequest(user, input);

  if (!balance || days > balance.available) {
    throw badRequest(`Not enough ${type.name} left: ${balance?.available ?? 0} available, ${days} requested`, {
      endDate: "Exceeds your balance",
    });
  }

  const overlapping = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.userId, user.id),
        inArray(leaveRequests.status, ["pending", "approved"]),
        lte(leaveRequests.startDate, input.endDate),
        gte(leaveRequests.endDate, input.startDate),
      ),
    )
    .limit(1);
  if (overlapping.length) throw conflict("You already have a leave request covering some of these dates");

  const [leave] = await db
    .insert(leaveRequests)
    .values({ ...input, userId: user.id, days })
    .returning();
  await audit(user.id, "leave.requested", "leave_request", leave.id, { days, type: type.code });
  return c.json({ leave }, 201);
});

leaveRoutes.post("/:id/cancel", validate("param", uuidParam), async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const [leave] = await db.select().from(leaveRequests).where(and(eq(leaveRequests.id, id), eq(leaveRequests.userId, user.id)));
  if (!leave) throw notFound("Leave request");

  // Pending can always be withdrawn; approved only before it starts.
  const cancellable = leave.status === "pending" || (leave.status === "approved" && leave.startDate > todayIn());
  if (!cancellable) throw badRequest("This leave can no longer be cancelled");

  const [updated] = await db.update(leaveRequests).set({ status: "cancelled" }).where(eq(leaveRequests.id, id)).returning();
  await audit(user.id, "leave.cancelled", "leave_request", id);
  return c.json({ leave: updated });
});

/* ------------------------------ Admin ------------------------------ */

export const adminLeaveRoutes = new Hono();
adminLeaveRoutes.use("*", requireRole("admin"));

adminLeaveRoutes.get(
  "/",
  validate(
    "query",
    z.object({
      status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
      userId: z.uuid().optional(),
      from: isoDate.optional(),
      to: isoDate.optional(),
    }),
  ),
  async (c) => {
    const { status, userId, from, to } = c.req.valid("query");
    const where = [];
    if (status) where.push(eq(leaveRequests.status, status));
    if (userId) where.push(eq(leaveRequests.userId, userId));
    if (from) where.push(gte(leaveRequests.endDate, from));
    if (to) where.push(lte(leaveRequests.startDate, to));
    const leaves = await leaveQuery()
      .where(where.length ? and(...where) : undefined)
      .orderBy(status === "pending" ? asc(leaveRequests.createdAt) : desc(leaveRequests.startDate))
      .limit(500);
    return c.json({ leaves });
  },
);

async function review(c, status, comment) {
  const admin = c.get("user");
  const { id } = c.req.valid("param");
  // Guarded update: only a still-pending request can be decided, so two admins can't race.
  const [leave] = await db
    .update(leaveRequests)
    .set({ status, reviewerId: admin.id, reviewComment: comment ?? null, reviewedAt: new Date() })
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.status, "pending")))
    .returning();
  if (!leave) {
    const [exists] = await db.select({ status: leaveRequests.status }).from(leaveRequests).where(eq(leaveRequests.id, id));
    if (!exists) throw notFound("Leave request");
    throw conflict(`This request was already ${exists.status}`);
  }
  await audit(admin.id, `leave.${status}`, "leave_request", id, comment ? { comment } : null);
  return c.json({ leave });
}

adminLeaveRoutes.post(
  "/:id/approve",
  validate("param", uuidParam),
  validate("json", z.object({ comment: optionalText(1000) })),
  (c) => review(c, "approved", c.req.valid("json").comment),
);

adminLeaveRoutes.post(
  "/:id/reject",
  validate("param", uuidParam),
  validate("json", z.object({ reason: z.string().trim().min(3, "A reason is required when rejecting").max(1000) })),
  (c) => review(c, "rejected", c.req.valid("json").reason),
);
