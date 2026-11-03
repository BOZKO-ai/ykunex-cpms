np# Project Documentation: Yakunex Client & Project Manager

This document records the implementation decisions for the Yakunex Week 02
Client & Project Management System assessment. The official brief is the
source of truth; the application is intentionally small and local.

## 1. Users and requirements

| User | Needs | Where in the system |
|---|---|---|
| Director / management | Quick view of customers, active projects, due-soon and overdue work | Dashboard |
| Project staff | Find a customer, check project details, update progress, add notes | Search, project page, updates, checklist |
| Admin / office staff | Add and correct customers and projects; adapt lists and branding | Forms, Settings |

All nine requirements (R1–R9) are implemented in the source. Final manual
verification is recorded separately in `TESTING_NOTES.md`. Scope decision:
**depth over breadth**: core flows first, with low-cost extras (task checklist,
activity log, and roles). Invoices, notifications, PDF reports, and a
user-management screen were intentionally left out because they are not core
requirements.

## 2. Data structure

```
User 1──* Project (assignee)          User 1──* ProjectUpdate (author)
Customer 1──* Project 1──* ProjectUpdate        Project 1──* Task
ListItem (SERVICE_AREA | CUSTOMER_STATUS | PROJECT_STATUS) referenced by Customer.statusId,
         Project.statusId, Project.serviceAreaId
Setting (key/value: branding, due-soon window)       Activity (audit log)
```

- One `ListItem` table drives every admin-editable dropdown. Records reference
  items by id, so renaming an item updates it everywhere; disabling hides it
  from new choices but keeps old records intact.
- `ListItem.isClosed` marks finished project statuses. Dashboard logic uses
  this flag, not status names.
- Archive is a soft-delete flag. Nothing is permanently deleted except
  checklist tasks after confirmation.
- Dates are stored as UTC midnight and formatted in UTC to avoid off-by-one
  day bugs.

## 3. Key design and technical decisions

| Decision | Why |
|---|---|
| Next.js full-stack, Server Actions | One codebase, no separate API to build and secure in five days |
| MySQL + Prisma | A conventional relational database for shared/local server use, with type-safe queries and easy schema changes |
| `prisma db push` | Fast for a small demo; production would use migrations |
| bcrypt passwords | Passwords are never stored in plain text |
| Signed HttpOnly JWT cookie | No session table; authorization is re-checked against the DB |
| Zod server validation | Browser checks can be bypassed, so every action validates on the server |
| Plain CSS variables | Settings branding applies consistently without a build step |
| Text plus status colour | Meaning never relies on colour alone |
| CSV formula escaping | Exported text cannot become a spreadsheet formula |

## 4. Usability and protection

The UI uses plain labels, one primary action per screen, friendly field
messages, confirmation before archiving/removal, useful empty states, visible
keyboard focus, responsive layouts, and table overflow containers. Search and
filters use labelled GET forms so links and browser navigation remain useful.

Passwords are bcrypt-hashed, sessions use signed HttpOnly cookies, middleware
and server actions enforce authentication, Settings is admin-only, uploads are
restricted by type and size, and the repository contains dummy data only.

## 5. Five-day plan

| Day | Focus | Evidence |
|---|---|---|
| 1 | Understand brief, choose scope/tools, design data and screens | Prisma schema, layout, seed data |
| 2–3 | Build core | Login, customers, projects, updates, search and filters |
| 4 | Complete and test | Dashboard, Settings, validation, responsive CSS, tests and docs |
| 5 | Verify, submit and demonstrate | Run instructions, dummy logins, demo flow, checklist |

The board can run the system with Node.js, npm, MySQL and the documented
commands; no paid service or deployment is required.

Before the first run, create the MySQL database/user, set the real
`DATABASE_URL` in `.env`, then run `npm run setup`. The setup command is
destructive because the assessment seed intentionally resets dummy data.

## 6. Assessment-board answers

- **Why this technology and storage?** Next.js Server Actions keep a small
  internal system in one codebase. Prisma with MySQL is type-safe and
  suitable for a shared local server,
  inexpensive, and easy to explain or change.
- **How was scope chosen?** Login, customers, projects, updates, search,
  dashboard, Settings and validation were prioritised. Reports, notifications
  and payments were left out.
- **How is data related?** A customer has many projects; a project has one
  customer, service area and status, an optional assignee, many updates and
  tasks. Updates retain author and creation time.
- **How are passwords and input protected?** bcrypt hashes passwords. Signed
  HttpOnly JWT cookies protect sessions, while middleware and server actions
  re-check authorization. Zod validates every form on the server.
- **How is it usable for non-technical staff?** Plain labels, consistent
  actions, searchable lists, confirmations, visible focus, responsive tables,
  and text plus colour for statuses.
- **Can a field be added live?** Add a nullable Prisma field, run
  `prisma db push`, extend Zod, add a labelled form field, persist it in the
  server action, display it on the detail page, and add a focused test.

## 7. Known limitations and next week

- Login throttling is in memory and single-process.
- There is no migration history and no user-management screen.
- Notes are append-only to keep history trustworthy.
- A future iteration could add user management, calendar/timeline views,
  reminders, PDF reports, migrations/CI, and Playwright end-to-end tests.
