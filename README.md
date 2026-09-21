# Lasan People — attendance & leave management

Two independently deployable apps in one repo:

| Folder      | What                                           | Stack                                              | Host (suggested) |
| ----------- | ---------------------------------------------- | -------------------------------------------------- | ---------------- |
| `/` (root)  | Web app: admin + employee dashboards           | Next.js 16 (App Router, Server Actions), Tailwind 4 | Vercel / Railway |
| `/backend`  | REST API, auth, business rules                 | Hono on Node, Drizzle ORM, PostgreSQL              | Railway          |

```
Browser ──► Next.js server (cookie: httpOnly JWT) ──Bearer──► Hono API ──► Postgres (Railway)
```

The browser never calls the API directly: Next.js server components and server actions do,
attaching the token from an httpOnly cookie. That keeps the frontend and backend on separate
domains without CORS/third-party-cookie issues, and the API stays reusable for a future mobile app.

## Features

**Admin**
- Overview: headcount, who's checked in, who's on leave, pending requests, upcoming holidays
- Employees: add (with gender, which drives maternity eligibility), edit, revoke / reinstate access, reset password
  (one-time temporary password shown to the admin, forced change on first login)
- Per-employee page: year-at-a-glance leave calendar, balances with per-person quota overrides, 1–5★ ratings with
  history, monthly attendance, profile and emergency contact
- Leave requests: approve with optional comment, reject with required reason; race-safe (can't double-decide)
- Holiday calendar: click a date to add/edit; mandatory vs optional holidays
- Settings: geofence mode (enforce / record only / off), office locations with radius ("use my current location"),
  weekly off days, leave-type quotas

**Employee**
- Dashboard: live clock, geofenced check-in/out, leave balance rings, recent requests, upcoming holidays
- Apply for leave with a live preview of how many days it will cost (weekends and holidays excluded), half days,
  overlap and balance checks, withdraw/cancel
- Attendance history and holiday calendar
- Profile: photo (resized client-side), phone, DOB, address, blood group, emergency contact; change password

**Security**
- bcrypt passwords, HS256 JWT with a per-user token version: revoking access, resetting or changing a password
  signs the user out everywhere immediately
- Every API route re-checks the user in the database (status + token version + role); `proxy.js` is only an
  optimistic redirect
- Login rate-limited; no user enumeration; audit log for every admin action
- Geofence is enforced server-side (haversine distance; GPS accuracy forgiven up to 50 m)

## Default leave policy (India)

Seeded defaults. Admins can change them in **Settings → Leave policy**, or per employee via **Adjust quota**.

| Type            | Days / year          | Basis |
| --------------- | -------------------- | ----- |
| Casual Leave    | 12                   | State Shops & Establishments Acts typically mandate 7–12 casual days; 12 is common in IT/services |
| Sick Leave      | 12                   | States mandate roughly 6–12 paid sick days (e.g. Maharashtra 8, many others 12) |
| Emergency Leave | 5                    | Not statutory; a company benefit. 3–5 days is typical |
| Maternity Leave | 182 (26 weeks)       | Maternity Benefit Act, 1961 (amended 2017): 26 weeks for the first two children (12 weeks from the third). Requires 80 days worked in the preceding 12 months. Counted in **calendar days**, female employees only |

That's **29 working days** a year for everyone, plus maternity where eligible. Many companies also offer
**Earned/Privilege Leave** (about 15–18 days, which most Shops Acts require) and paternity leave (5–15 days).
You can add these as extra leave types. Check the Shops & Establishments Act for your state.

## Local setup

Prereqs: Node 20+, a Postgres database (your Railway one works).

```bash
# 1. API
cd backend
cp .env.example .env         # set DATABASE_URL (Railway → Postgres → DATABASE_PUBLIC_URL), JWT_SECRET, ADMIN_*
npm install
npm run db:migrate           # creates tables
npm run db:seed              # leave types, fixed-date holidays, first admin
npm run dev                  # http://localhost:4000

# 2. Web app (new terminal, repo root)
cp .env.example .env.local   # LASAN_API_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:3000
```

Sign in with `ADMIN_CODE` (default `ADMIN`) or `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`.

> Geolocation only works on `https://` or `localhost`. To test check-in from a phone, use the deployed URL.

## Deploying

**API on Railway**: new service from this repo with **Root Directory = `backend`**.
- Variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}` (private network), `JWT_SECRET`, `CORS_ORIGINS`, `APP_TIMEZONE`
- Pre-deploy command: `npm run db:migrate` · Start command: `npm start`
- Run `npm run db:seed` once (Railway shell) with `ADMIN_EMAIL` / `ADMIN_PASSWORD` set.

**Web app on Vercel or Railway**: root directory = repo root.
- `LASAN_API_URL=https://<your-api>.up.railway.app`
- `NEXT_PUBLIC_APP_TIMEZONE=Asia/Kolkata`

## Changing the schema

Edit `backend/src/db/schema.js`, then `npm run db:generate` (writes SQL to `backend/drizzle/`),
review it, commit it, and `npm run db:migrate`.

## Built to grow

- `leave_allocations`: per-employee/year quota overrides (pro-rata joiners, carry-forward, special grants)
- `attendance.source` (`geo` / `remote` / `manual`) and stored coordinates, accuracy and distance for audits
- `settings` key/value store: new org-level switches need no migration
- `audit_logs` captures who did what, ready for an activity feed
- Avatars are stored as small data URLs; move them to S3/R2 later by storing a URL in the same column

## Project map

```
app/                     Next.js routes
  admin/                 overview, employees/[id], leaves, attendance, holidays, settings
  employee/              dashboard, leaves, attendance, holidays, profile
  actions/               server actions → API
components/              UI kit, calendar, punch card, shell
lib/api.js               server-only API client
proxy.js                 optimistic route guard
backend/src/
  routes/                auth, me, leaves, catalog (leave types, holidays, org), attendance, employees, overview
  lib/                   auth, leave maths, geofence, dates, settings, audit
  db/                    schema, migrate, seed
backend/drizzle/         SQL migrations
```
