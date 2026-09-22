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

**Contents:** [User manual](#user-manual) · [Features](#features) · [Leave policy](#default-leave-policy-india) ·
[Local setup](#local-setup) · [Deploying](#deploying) · [Project map](#project-map)

---

# User manual

Lasan People is where you check in and out of work, apply for leave, and see company holidays.
Admins also use it to manage employees, approve leave, and set company rules. It works in any modern
browser on a phone or a computer.

- [1. Getting started (everyone)](#1-getting-started-everyone)
- [2. Employee guide](#2-employee-guide)
- [3. Admin guide](#3-admin-guide)
- [4. Troubleshooting & FAQ](#4-troubleshooting--faq)

## 1. Getting started (everyone)

### Signing in

1. Open the Lasan People web address your company gave you.
2. In **Employee ID or email**, enter your employee ID (for example `LS001`) or your work email.
3. Enter your password and select **Sign in**. The eye icon shows or hides what you type.

Employees go to their **Dashboard** and admins go to the **Overview**.

### First sign-in: set your own password

Your admin gives you a **temporary password**. The first time you sign in, you are asked to replace it:

1. In **Current / temporary password**, enter the password your admin gave you.
2. Enter a **New password** that has at least **8 characters, a letter and a number**. The three checks
   below the field turn green as you meet each rule.
3. Type it again in **Confirm new password** and select **Save password**.

You can change your password again at any time from **Profile → Change password**.

> **Forgot your password?** Ask your admin to reset it. You'll get a new temporary password and will set
> your own again the next time you sign in.

### Getting around

- **On a computer**, the menu is on the left. Your name, photo and the **Sign out** button are at the bottom of it.
- **On a phone**, employees have a tab bar at the bottom of the screen (Dashboard, Leaves, Attendance,
  Holidays, Profile). The **☰** button at the top opens the full menu, including **Sign out**.

### Signing out

Select the **Sign out** icon (arrow) next to your name. If your password is changed or reset, or your access
is revoked, you are signed out on every device straight away.

---

## 2. Employee guide

### 2.1 Dashboard

Your home screen shows:

- **Attendance card**: a live clock, today's check-in and check-out times, and how long you've worked.
- **Leave balance** for each leave type.
- **Recent requests** and their status.
- **Upcoming holidays**.
- An **Apply for leave** button at the top.

### 2.2 Checking in and out

1. Open the **Dashboard**.
2. Select **Check in**. If your company uses location check-in, your browser asks for permission to use
   your location. Select **Allow**.
3. At the end of the day, select **Check out**.

After you check out you'll see *"You're done for today."* You can check in and out **once per day**.

The badge in the top-right corner of the card shows where you are:

| Badge | Meaning |
| ----- | ------- |
| **At *Office name*** (green) | You're inside the office area |
| ***120 m* from *Office name*** (amber) | You're outside the office area |
| **Location not required** | Your company doesn't use location check-in |

Your location is checked **only when you select Check in or Check out**. It is not tracked at any other time.

Depending on your company's setting:

- **Enforce**: you can only check in while you're inside an office area.
- **Record only**: you can check in from anywhere, but check-ins outside the office are marked **Remote**.
- **Off**: location isn't used.

> Tip: GPS indoors can be off by a few metres. If a check-in is refused, move near a window or the entrance
> and try again. Small GPS errors (up to 50 m) are already allowed for.

### 2.3 Applying for leave

1. Select **Apply for leave** from the Dashboard or **My leaves**.
2. Choose a **Leave type**. Each option shows how many days you have left.
3. Choose the **From** and **To** dates.
4. For a single day, you can choose **Full day**, **First half** or **Second half** where the leave type
   allows half days.
5. Check the preview, for example *"This uses 3 days · 9 days will remain"*.
6. Enter a short **Reason** and select **Submit request**.

Things to know:

- **Weekends and company holidays are not counted.** A leave from Friday to Monday usually costs 2 days.
- **Maternity leave** is counted in calendar days, so weekends and holidays are included.
- You can't submit a request if you don't have enough balance, or if the dates overlap a request you
  already have.
- Some leave types are only shown to employees who are eligible for them. For example, maternity leave is
  only available to female employees.

### 2.4 Tracking, withdrawing and cancelling leave

Open **My leaves** to see:

- Your **balance** for each leave type (days left / annual quota).
- A **month calendar**. Approved leave is shown as a solid bar, pending leave as a dashed bar, and holidays
  in cyan. Use the arrows to move between months.
- **Requests** for the year with their status: `pending`, `approved`, `rejected` or `cancelled`. If your
  admin added a comment or a rejection reason, it appears under the request.

To change your plans:

- **Withdraw request**: for a request that hasn't been decided yet.
- **Cancel leave**: for an approved leave that hasn't started yet. The days go back to your balance.

### 2.5 Attendance history

**Attendance** shows every check-in for the month you pick:

- Totals: **Days present**, **Avg. day** and **Total hours**.
- A calendar where **green** means you checked in at the office, **amber** means remote, and **cyan** means a holiday.
- A **Log** listing each day's in and out times and hours worked.

### 2.6 Holidays

**Holidays** shows the company holiday calendar. Holidays marked **Optional** still count as working days,
so if you take one off you need to apply for leave.

### 2.7 Your profile

Open **Profile** to keep your details up to date:

- **Photo**: select **Upload photo** or **Change photo** and choose a PNG, JPG or WEBP image under 10 MB.
  It is cropped to a square automatically. Select **Remove** to delete it.
- **Personal details**: phone, date of birth, address.
- **Blood group**: useful in a medical emergency.
- **Emergency contact**: name, relationship and phone number.

Select **Save profile** when you're done. Your name, email, employee ID, designation and department can
only be changed by an admin.

---

## 3. Admin guide

Admins have these pages: **Overview**, **Employees**, **Leave requests**, **Attendance**, **Holidays** and
**Settings**. The number next to **Leave requests** is how many requests are waiting for you.

### 3.1 First-time setup checklist

1. **Settings → General**: enter the company name, choose the geofence mode and the weekly off days.
2. **Settings → Office locations**: add each office (see [3.7](#37-settings)).
3. **Settings → Leave policy**: check the leave types and yearly quotas.
4. **Holidays**: add this year's company holidays.
5. **Employees**: add your team and share each person's login.

### 3.2 Overview

The Overview shows today's numbers: **Active employees**, **Checked in today**, **On leave today** and
**Pending requests**. It also lists the leave requests waiting for you (oldest first), today's roll-call and
holidays in the next 90 days. Use **Add employee** at the top to add someone quickly.

### 3.3 Adding an employee

1. Go to **Employees** and select **Add employee**.
2. Fill in:
   - **Full name**
   - **Employee ID**: the ID the person signs in with, for example `LS001`
   - **Gender**: decides which leave types they can use (for example, maternity leave)
   - **Work email**
   - **Designation**, **Department** and **Date of joining** (optional)
   - **Access**: *Employee* or *Administrator*
   - **Temporary password**: leave it blank to generate one automatically
3. Select **Create & get login**.
4. A card shows the person's **login ID and temporary password**. Copy it and send it to them now.
   **The password is shown only once.**

The employee is asked to set their own password when they first sign in.

### 3.4 Managing employees

On **Employees**, you can search by name, ID, email or team, and filter by **All**, **Active** or **Revoked**.
Select a row to open that employee's page.

At the top of an employee's page:

| Button | What it does |
| ------ | ------------ |
| **Edit** | Change name, ID, gender, email, designation, department or date of joining |
| **Reset password** | Creates a new temporary password (shown once) and signs the person out everywhere |
| **Revoke access** | Blocks sign-in straight away and cancels their pending leave requests. Use this when someone leaves |
| **Reinstate** | Gives a revoked employee access again |

The employee page has four tabs:

- **Leave calendar**: the whole year at a glance, with leave balances. Use **‹ ›** to change the year.
  Select **Adjust quota** under a balance to give this person a different number of days for that year, for
  example fewer days for someone who joined mid-year, or extra days as a special grant. Leave the field
  blank to go back to the company default.
- **Ratings**: give a **1–5 star** rating for a period (`2026`, `2026-09` or `2026-Q3`) with an optional
  comment. Earlier ratings are listed as history. The latest rating appears in the employee list.
- **Attendance**: the employee's check-ins by month. Green means inside the geofence and amber means remote or outside.
- **Profile**: the personal details and emergency contact the employee entered.

### 3.5 Reviewing leave requests

1. Open **Leave requests**. The **Pending** tab lists requests waiting for a decision.
2. Check the employee, leave type, dates, number of days and reason.
3. Select one of these:
   - **Approve**: you can add a comment, for example *"Enjoy your time off!"*.
   - **Reject**: you must enter a reason. The employee will see it.

Use the **Approved**, **Rejected** and **Cancelled** tabs to look at past decisions. Once a request has been
decided it can't be decided again, even if two admins try at the same time.

### 3.6 Attendance

**Attendance** shows the roll-call for one day: **Present**, **On leave** and **Not checked in**, plus each
person's check-in and check-out times, hours worked and location (**In office** with the distance, or
**Remote**). Use **‹ ›** or the date picker to see earlier days, and **Today** to come back. Select a person
to open their attendance history.

### 3.7 Settings

**General**

- **Company name**
- **Geofence for check-in**:
  - **Enforce**: check-in only works inside an office area.
  - **Record only**: check-in works anywhere, and check-ins outside an office are marked *Remote*.
  - **Off**: location isn't used. Good for fully remote teams.
- **Weekly off days**: the days that aren't counted when working out how many days a leave uses.

Select **Save settings** to apply the changes.

**Leave policy**

Each leave type has a colour, a name, a yearly quota in days, and an **Active** switch. Select **Save** on
each row you change. Changing a quota here changes it for everyone. To change it for one person, use
**Adjust quota** on their employee page instead.

**Office locations**

1. Select **Add office** and enter a **Name** (and an address if you like).
2. Stand inside the office and select **Use my current location** to fill in the latitude and longitude.
   You can also type them in.
3. Set the **Radius** in metres. 100–200 m suits most offices.
4. Make sure **Active** is ticked and select **Add office**.

Select an office to edit or delete it. If the mode is **Enforce** but there's no active office, check-ins
are allowed from anywhere, and a warning explains this.

### 3.8 Holidays

1. Open **Holidays** and select a date on the calendar, or select **Add**.
2. Enter the **Name** and **Date**.
3. Tick **Optional / restricted holiday** if employees can choose whether to take it. Optional holidays
   appear on calendars but still count as working days for leave.
4. Select **Add holiday**.

Select a holiday on the calendar or in the list to edit it, or use the bin icon to delete it.

---

## 4. Troubleshooting & FAQ

| Problem | What to do |
| ------- | ---------- |
| *"Location is required. Allow location access…"* | Allow location for this site in your browser settings (on a phone, also check that Location Services are on for your browser), then try again. |
| Check-in says I'm outside the office | Move closer to the office or a window and try again. If you're in the right place, ask your admin to check the office location and radius. |
| *"You have already checked in / out today"* | You can check in and out once per day. Ask your admin if a time needs fixing. |
| *"You already have a leave request covering some of these dates"* | Withdraw or cancel the existing request first, then apply again. |
| *"Those dates are all weekends or holidays"* | Those days don't need leave. |
| Submit is disabled with *"only N days are available"* | You don't have enough balance. Choose fewer days or a different leave type, or talk to your admin. |
| I can't see a leave type | You may not be eligible for it, or the admin has turned it off. |
| I can't cancel a leave | Approved leave can only be cancelled before it starts. |
| I was signed out suddenly | Your password was changed or reset, or your access was changed. Sign in again, or contact your admin. |
| Forgot password | Ask your admin to **Reset password**. |
| Location doesn't work at all | Location only works on the secure (`https://`) address of the app. |

---

# For developers

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
