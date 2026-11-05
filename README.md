# Yakunex Client & Project Manager

Internal system for Yakunex staff to manage **customers**, the **projects** delivered for them, dated **progress updates**, and an **overview of what needs attention**. Built for the Week 02 internship assessment (2–6 Nov 2026).

**Stack:** Next.js 15 (App Router, Server Actions) · TypeScript · Prisma + MySQL · Zod · bcryptjs · jose (JWT cookie). No external services, runs locally with free tools.

## Prerequisites
- Node.js **20 or newer** (`node -v`)
- MySQL **8 or newer**, with `mysql` and `mysqldump` available on `PATH`
- npm (comes with Node)

## Setup and run (about 2 minutes)
```bash
npm install
cp .env.example .env        # Windows (cmd): copy .env.example .env
npm run setup               # creates/updates MySQL tables and loads dummy data
npm run dev                 # open http://localhost:3000
```

Create the MySQL database and user before `npm run setup` (example for a local
development server):

```sql
CREATE DATABASE yakunex_cpms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cpms_user'@'localhost' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON yakunex_cpms.* TO 'cpms_user'@'localhost';
FLUSH PRIVILEGES;
```

Then set `DATABASE_URL` in `.env` to the real MySQL credentials. Never commit
that file.
Production-style run: `npm run build && npm start`.

## Demo logins (dummy values only)
| Role  | Email                    | Password     |
|-------|--------------------------|--------------|
| Admin | admin@yakunex.example    | Admin@12345  |
| Staff | udara7355@gmail.com    | 1234@Samare |

Admins can open **Settings**; staff cannot.

## What is included
- **R1 Login:** bcrypt-hashed passwords, signed HttpOnly session cookie, logout, Admin/Staff roles, lock after 5 failed attempts.
- **R2 Customers:** add, view, edit, archive/restore; search + filters (status, type); paginated.
- **R3 Projects:** add, view, edit, archive/restore; linked to a customer (one customer, many projects); status, service area, dates, progress, assignee, budget.
- **R4 Updates:** dated notes (optionally set progress), newest first; plus a task checklist per project.
- **R5 Search/filter:** by name, status, service area, customer, assignee, deadline (overdue / due soon / date range). Customer page lists its projects.
- **R6 Dashboard:** customers, open projects, projects by status, due soon, overdue, recent activity.
- **R7 Settings (admin):** add / rename / disable service areas, customer statuses, project statuses (with colour and “counts as finished”); company name, logo upload, colours, “due soon” window.
- **R8 Safety:** server-side validation with friendly messages, confirm before archive/remove, CSV export, `npm run backup`.
- **R9 Usability:** responsive (desktop/tablet/phone), labelled fields, keyboard focus styles, skip link, text + colour (never colour alone), automatic readable text colour for any brand colour.
- **Extras:** activity log, task checklist, role-based Settings access.

The official brief is the source of truth. See
`docs/COMPLIANCE_AUDIT.md` for the requirement-by-requirement audit,
verification boundaries, demonstration plan, and final submission checklist.

## Useful commands
| Command | What it does |
|---|---|
| `npm run setup` | Create/refresh MySQL schema and **reset** to dummy data |
| `npm run db:push` | Apply Prisma schema changes without resetting data |
| `npm run db:seed` | Reset to dummy data only |
| `npm run backup` | Export the configured MySQL database to `backups/*.sql` |
| `npm test` | Run unit tests (validation, dates, colours) |
| `npm run typecheck` | TypeScript check |

## Project layout
```
prisma/schema.prisma   data model          prisma/seed.ts   dummy data
src/lib/               auth, validation, dates, db, settings helpers
src/components/        form components (client) + UI pieces (server)
src/app/(app)/         protected pages: dashboard, customers, projects, settings, CSV export
src/app/login/         login page + action
src/middleware.ts      blocks unauthenticated requests
docs/                  documentation, testing notes, AI disclosure
```

## Troubleshooting
- *“AUTH_SECRET is missing”* → you skipped `cp .env.example .env`; restart after copying.
- *“The table `payment` does not exist”* → run `npm run db:push`, then restart the dev server.
- *Reset everything* → run `npm run setup` (this deletes and reseeds all dummy data).
- Port busy → `npm run dev -- -p 3001`.

Do not submit `.env`, database dumps, backup files, real credentials, or
real customer records. The included credentials and seed records are dummy
assessment values only.

## v3 additions
- **Calendar** (`/calendar`): month view of project and task deadlines, "only my work" filter, accessible agenda list.
- **Payment ledger** (project page): record each payment (date, amount, method, reference), balance and status, CSV export (`/export/payments`). `Project.paidAmount` is kept in step automatically.
- **Customer report** (`/customers/<id>/report`): printable summary with projects, budget and money received.
- **Permissions enforced on the server**: read-only `VIEWER` users can no longer change data by calling an action directly; creating/archiving projects and removing payments need Manager or Admin.
- **UI refinement** (`src/app/pro.css`): flatter surfaces, tabular numbers, grouped sidebar with a gold rail on the active page.

After pulling these changes run `npm run setup` once (adds the `Payment` table and reseeds dummy data).
