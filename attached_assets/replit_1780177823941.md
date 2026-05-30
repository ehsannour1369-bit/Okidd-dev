# oKidd Educational Platform

A multi-role Persian (RTL) educational platform for schools, teachers, parents, and students.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/okidd run dev` — run the frontend (port 24048)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `SESSION_SECRET` — Express session secret (set as secret)

## Demo Accounts (username: email or phone, password: national ID)

| Email | Phone | National ID | Role | Description |
|---|---|---|---|---|
| admin@okidd.com | 09120000001 | 1111111111 | Admin | Full system access |
| school@okidd.com | 09120000002 | 2222222222 | school_manager | Full access to all branches |
| branch@okidd.com | 09120000003 | 3333333333 | branch_manager | Access limited to شعبه مرکزی |
| teacher@okidd.com | 09120000004 | 4444444444 | Teacher | View classes, student progress |
| parent@okidd.com | 09120000005 | 5555555555 | Parent | Monitor children |
| student@okidd.com | 09120000006 | 6666666666 | Student (Male, Purple theme) | Access books/lessons |
| student2@okidd.com | 09120000007 | 7777777777 | Student (Female, Pink theme) | Access books/lessons |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + Zustand + TanStack Query
- Styling: Tailwind CSS v4 + Vazirmatn font (RTL Persian)
- API: Express 5 + bcryptjs + express-session
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle DB schema (users, schools, branches, branchManagers, classes, books, lessons, etc.)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, schools, branches, branchManagers, classes, books, lessons, grades, notifications, dashboard, etc.)
- `artifacts/okidd/src/pages/` — Role-based pages (admin, school, branch, teacher, parent, student)
- `artifacts/okidd/src/store/auth.ts` — Zustand auth store
- `artifacts/okidd/src/lib/api.ts` — API client utilities

## Architecture decisions

- Multi-role auth via token (admin, school_manager, branch_manager, teacher, parent, student)
- `school_manager` has full access to all branches; routes under `/school`
- `branch_manager` has access to their assigned branch only; routes under `/branch`
- A `school_manager` can also be in branch_managers table — their `role` field determines which panel they see
- When creating a school via `POST /schools`, pass `managerEmail`+`managerPassword` to auto-create a school_manager account
- When creating a branch via `POST /branches`, pass `createManagerAccount:true`+`managerEmail`+`managerPassword` to auto-create a branch_manager account
- Branch manager assignment tracked in `branch_managers` table; changing managers: deactivates previous record, inserts new one — students and packages are untouched
- `POST /branch-managers` deactivates previous active manager for same branch+year before inserting new one
- Student themes: male students get purple, female students get pink
- All UI is RTL Persian using Vazirmatn font
- Role-based routing — each role sees its own dashboard and pages
- `branchId` is included in login response for `branch_manager` role (looked up from branch_managers table)

## Product

Multi-role educational management platform supporting:
- **Admin**: manage schools, users, packages, books, content, transactions
- **School Manager** (`school_manager`): manage all branches, classes, students, teachers, exam schedules, notifications
- **Branch Manager** (`branch_manager`): manage their single assigned branch — classes, students, teachers, notifications, exams
- **Teacher**: view classes, student progress, schools, grade entry
- **Parent**: monitor children, view notifications
- **Student**: access books/lessons, view rankings, play educational games

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before building
- The `SESSION_SECRET` must be set as a secret in Replit for auth to work
- Frontend uses `@workspace/api-client-react` for all API calls (not raw fetch)
- All pages are RTL — use `dir="rtl"` and Vazirmatn font
- `branch_manager` login response includes `branchId` (from branch_managers table); `school_manager` branchId is null
- Role was renamed from `school` → `school_manager`; `branch_manager` is a new role

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
