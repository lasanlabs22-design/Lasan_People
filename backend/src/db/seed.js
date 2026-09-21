/**
 * Idempotent seed: default leave policy, fixed-date national holidays, and the first admin.
 * Safe to re-run — existing rows are left untouched.
 *
 *   ADMIN_EMAIL=you@company.com ADMIN_PASSWORD=... npm run db:seed
 */
import { sql as dsql } from "drizzle-orm";
import { db, schema, sql } from "./client.js";
import { hashPassword } from "../lib/auth.js";
import { todayIn } from "../lib/dates.js";

// Defaults based on common Indian practice (see README "Leave policy"). Admins can edit these anytime.
const LEAVE_TYPES = [
  {
    code: "CASUAL",
    name: "Casual Leave",
    description: "Short personal errands and planned time off. Does not carry forward.",
    annualQuota: 12,
    color: "#6366f1",
    sortOrder: 1,
  },
  {
    code: "SICK",
    name: "Sick Leave",
    description: "Illness or medical appointments. A medical certificate may be requested for 3+ consecutive days.",
    annualQuota: 12,
    color: "#10b981",
    sortOrder: 2,
  },
  {
    code: "EMERGENCY",
    name: "Emergency Leave",
    description: "Unforeseen family or personal emergencies.",
    annualQuota: 5,
    color: "#f59e0b",
    sortOrder: 3,
  },
  {
    code: "MATERNITY",
    name: "Maternity Leave",
    description: "26 weeks (182 calendar days) for the first two children under the Maternity Benefit Act, 1961.",
    annualQuota: 182,
    eligibleGender: "female",
    countsCalendarDays: true,
    allowHalfDay: false,
    color: "#ec4899",
    sortOrder: 4,
  },
];

const FIXED_HOLIDAYS = [
  ["01-26", "Republic Day"],
  ["05-01", "Labour Day"],
  ["08-15", "Independence Day"],
  ["10-02", "Gandhi Jayanti"],
  ["12-25", "Christmas"],
];

async function main() {
  await db.insert(schema.leaveTypes).values(LEAVE_TYPES).onConflictDoNothing({ target: schema.leaveTypes.code });
  console.log("✓ leave types");

  const year = Number(todayIn().slice(0, 4));
  await db
    .insert(schema.holidays)
    .values(FIXED_HOLIDAYS.map(([md, name]) => ({ date: `${year}-${md}`, name })))
    .onConflictDoNothing({ target: schema.holidays.date });
  console.log(`✓ fixed-date holidays for ${year}`);

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("• ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin creation");
    return;
  }
  const [existing] = await db.select().from(schema.users).where(dsql`lower(${schema.users.email}) = ${email}`);
  if (existing) {
    console.log(`• admin ${email} already exists`);
    return;
  }
  const [admin] = await db
    .insert(schema.users)
    .values({
      employeeCode: process.env.ADMIN_CODE ?? "ADMIN",
      email,
      name: process.env.ADMIN_NAME ?? "Administrator",
      gender: process.env.ADMIN_GENDER ?? "other",
      role: "admin",
      designation: "Administrator",
      passwordHash: await hashPassword(password),
      mustChangePassword: false,
    })
    .returning();
  await db.insert(schema.profiles).values({ userId: admin.id }).onConflictDoNothing();
  console.log(`✓ admin ${email} created`);
}

try {
  await main();
} finally {
  await sql.end();
}
