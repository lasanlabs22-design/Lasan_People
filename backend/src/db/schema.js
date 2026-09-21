import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  smallint,
  numeric,
  date,
  timestamp,
  doublePrecision,
  jsonb,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "employee"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const userStatusEnum = pgEnum("user_status", ["active", "revoked"]);
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected", "cancelled"]);
export const leaveGenderEnum = pgEnum("leave_gender", ["any", "male", "female"]);
export const halfDayEnum = pgEnum("half_day", ["none", "first_half", "second_half"]);
export const attendanceSourceEnum = pgEnum("attendance_source", ["geo", "manual", "remote"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeCode: varchar("employee_code", { length: 32 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("employee"),
    name: varchar("name", { length: 120 }).notNull(),
    gender: genderEnum("gender").notNull(),
    designation: varchar("designation", { length: 120 }),
    department: varchar("department", { length: 120 }),
    dateOfJoining: date("date_of_joining"),
    status: userStatusEnum("status").notNull().default("active"),
    mustChangePassword: boolean("must_change_password").notNull().default(true),
    // Bumped on revoke / password change / reset to invalidate every issued token.
    tokenVersion: integer("token_version").notNull().default(0),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("users_employee_code_uq").on(sql`lower(${t.employeeCode})`),
    uniqueIndex("users_email_uq").on(sql`lower(${t.email})`),
  ],
);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  // Small, client-resized JPEG/WEBP data URL. Swap for object storage URL later without schema churn.
  avatar: text("avatar"),
  phone: varchar("phone", { length: 32 }),
  dateOfBirth: date("date_of_birth"),
  bloodGroup: varchar("blood_group", { length: 4 }),
  address: text("address"),
  emergencyContactName: varchar("emergency_contact_name", { length: 120 }),
  emergencyContactRelation: varchar("emergency_contact_relation", { length: 60 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 32 }),
  ...timestamps,
});

export const leaveTypes = pgTable("leave_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 24 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  description: text("description"),
  annualQuota: numeric("annual_quota", { precision: 5, scale: 1, mode: "number" }).notNull(),
  eligibleGender: leaveGenderEnum("eligible_gender").notNull().default("any"),
  // Maternity is counted in calendar days; everything else skips weekends + holidays.
  countsCalendarDays: boolean("counts_calendar_days").notNull().default(false),
  allowHalfDay: boolean("allow_half_day").notNull().default(true),
  color: varchar("color", { length: 16 }).notNull().default("#6366f1"),
  sortOrder: smallint("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

// Per-employee, per-year override of a leave type's quota (joining pro-rata, special grants, carry-forward).
export const leaveAllocations = pgTable(
  "leave_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id, { onDelete: "cascade" }),
    year: smallint("year").notNull(),
    days: numeric("days", { precision: 5, scale: 1, mode: "number" }).notNull(),
    note: text("note"),
    ...timestamps,
  },
  (t) => [uniqueIndex("leave_alloc_uq").on(t.userId, t.leaveTypeId, t.year)],
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    leaveTypeId: uuid("leave_type_id")
      .notNull()
      .references(() => leaveTypes.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    halfDay: halfDayEnum("half_day").notNull().default("none"),
    days: numeric("days", { precision: 5, scale: 1, mode: "number" }).notNull(),
    reason: text("reason").notNull(),
    status: leaveStatusEnum("status").notNull().default("pending"),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    reviewComment: text("review_comment"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("leave_req_user_idx").on(t.userId, t.startDate),
    index("leave_req_status_idx").on(t.status),
    check("leave_req_range_ck", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const holidays = pgTable("holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  isOptional: boolean("is_optional").notNull().default(false),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ratedBy: uuid("rated_by").references(() => users.id, { onDelete: "set null" }),
    score: smallint("score").notNull(),
    // Free-form period label, e.g. "2026-Q3" or "2026-09".
    period: varchar("period", { length: 16 }).notNull(),
    comment: text("comment"),
    ...timestamps,
  },
  (t) => [
    index("ratings_user_idx").on(t.userId, t.createdAt),
    check("ratings_score_ck", sql`${t.score} between 1 and 5`),
  ],
);

export const officeLocations = pgTable("office_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  address: text("address"),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radiusMeters: integer("radius_meters").notNull().default(150),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    source: attendanceSourceEnum("source").notNull().default("geo"),
    checkInAt: timestamp("check_in_at", { withTimezone: true }).notNull(),
    checkInLat: doublePrecision("check_in_lat"),
    checkInLng: doublePrecision("check_in_lng"),
    checkInAccuracy: doublePrecision("check_in_accuracy"),
    checkInOfficeId: uuid("check_in_office_id").references(() => officeLocations.id, { onDelete: "set null" }),
    checkInDistance: doublePrecision("check_in_distance"),
    checkOutAt: timestamp("check_out_at", { withTimezone: true }),
    checkOutLat: doublePrecision("check_out_lat"),
    checkOutLng: doublePrecision("check_out_lng"),
    checkOutAccuracy: doublePrecision("check_out_accuracy"),
    checkOutOfficeId: uuid("check_out_office_id").references(() => officeLocations.id, { onDelete: "set null" }),
    checkOutDistance: doublePrecision("check_out_distance"),
    note: text("note"),
    ...timestamps,
  },
  (t) => [uniqueIndex("attendance_user_date_uq").on(t.userId, t.date), index("attendance_date_idx").on(t.date)],
);

// Key/value org settings (geofence enforcement, timezone, work week...).
export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: jsonb("value").notNull(),
  ...timestamps,
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 64 }).notNull(),
    entity: varchar("entity", { length: 64 }).notNull(),
    entityId: uuid("entity_id"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId)],
);
