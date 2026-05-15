# BKAD Pasuruan Dashboard — v1 Plan

**Owner:** Solo developer
**Timeline:** 4 weeks
**Target users:** Kepala BKAD, Sekretaris BKAD (viewers); data uploader (admin)
**Scope:** Budget realization (LRA) only. Employee and asset modules deferred to v1.1 and v1.2.

---

## Problem Frame

BKAD Kabupaten Pasuruan is responsible for the financial and asset management of the regency government, but the data needed lives in three disconnected systems: budget/realization in SIPD Penatausahaan, employee data in Sub Bagian Umum dan Kepegawaian, and asset data in Bagian Pengelolaan BMD. Getting a consolidated view today means pulling exports from three places, reconciling them in Excel, and rebuilding the same report repeatedly. Decisions wait on data, and the data is stale by the time it arrives.

The minimum compelling v1 is **a single dashboard the Head and Secretary of BKAD can open to see consolidated budget realization in one place**, without phoning the sub-divisions. Employee and asset data are real needs but explicitly deferred — they ship as separate modules once sample data is available.

## Goals & Non-Goals

**Goals (v1)**
- Kepala and Sekretaris BKAD can sign in and view a single dashboard summarizing budget vs realization, broken down by Kelompok Belanja and Program.
- LRA data from SIPD Penatausahaan is consolidated into one Postgres database as a single source of truth.
- LRA data can be refreshed via manual Excel upload from the admin page.
- Dashboard renders in under 3 seconds against typical BKAD data volume (~10,000 rows).
- Deployed to an Indonesian cloud provider (VPS) accessible from BKAD networks.

**Non-goals (v1)** — *be ruthless*
- Employee and asset data — deferred to v1.1 and v1.2.
- Multi-user access for all BKAD staff — deferred.
- Live API integration with SIPD Penatausahaan — deferred.
- Editing data in the dashboard — deferred. Read-only; corrections happen at the source.
- Role-based permissions, audit logs, approval workflows — deferred.
- Drill-down to rekening (account) level transactions — deferred. v1 aggregates up to Sub Kegiatan.
- Mobile-optimized UI — deferred. Desktop-only for v1 (Kepala and Sekretaris use laptops).
- Bahasa / English language toggle — deferred. Bahasa Indonesia only.
- Email or WhatsApp notifications, scheduled reports — deferred.
- Historical trends beyond the current fiscal year — deferred. v1 shows TA berjalan only.
- Export to PDF — deferred (browser print is acceptable).
- Automatic data validation or reconciliation — deferred. Garbage in, garbage out for v1.

**Outside this product's identity**
- Not a replacement for SIPD, SIMPEG, or SIMDA-BMD. This is a *view*, not a system of record.
- Not a public transparency portal.
- Not a budgeting or forecasting tool.

## Target Users

- **P1. Kepala BKAD (primary, v1)** — head of the agency. Logs in, opens the dashboard, reads numbers. Does not upload or edit. Desktop user.
- **P2. Sekretaris BKAD (secondary, v1)** — same view access as Kepala. Helps prepare summaries.
- **P3. Data uploader (operational, v1)** — the developer, or designated staff. Receives LRA exports and uploads them. Admin-only access.

## Success Criteria

**Launch criteria**
- Kepala can sign in and see the dashboard with current LRA data in under 3 seconds.
- Uploader can refresh LRA via Excel upload in under 2 minutes.
- Dashboard reflects uploaded data within 10 seconds of a successful upload.
- All visualizations render correctly with real BKAD LRA data.
- Deployed at a stable URL reachable from BKAD workstations.

**Quality bar**
- TypeScript strict, lint and typecheck green on every commit.
- Smoke test passes: login → view dashboard → upload new LRA → see updated numbers.
- No plaintext password storage; uploaded files are parsed then discarded (not stored).

## Architecture: Module-Driven

The codebase is organized by business domain, not by technical layer. Each domain (budget, employee, asset) is a self-contained module that does not depend on other modules. v1 ships the budget module only; employee and asset modules will be added without touching budget code.

```
src/
├── modules/
│   └── budget/              # LRA data (v1)
│       ├── components/
│       ├── server/
│       ├── schema.ts
│       ├── types.ts
│       ├── index.ts         # Public API
│       └── README.md
├── routes/                  # Thin route files
│   ├── __root.tsx
│   ├── index.tsx
│   ├── auth/
│   ├── dashboard/
│   └── admin/upload/
├── shared/
│   ├── auth/
│   ├── db/
│   ├── ui/
│   └── lib/
└── styles/
```

### Module rules
1. **No cross-module imports.** Enforced by ESLint `no-restricted-imports`.
2. **Public API via index files.** Internal helpers stay private to the folder.
3. **Routes are thin.** Business logic stays in module server functions.
4. **DB tables are namespaced.** `BudgetRealization`, `BudgetUploadHistory`, etc.
5. **Every module has a README.** Documents data source, schema quirks, limitations.

## Requirements

**Core data pipe (budget module)**
- **R1.** Uploader can upload an LRA Excel file via the admin page; valid rows persist to Postgres.
- **R2.** Parser handles the hierarchical LRA structure: skips the 3-row header, detects code level (Program / Kegiatan / Sub Kegiatan / Rekening), stores each row with `level`, `kode`, and `parent_kode`.
- **R3.** Each upload replaces the prior dataset for the budget module (full refresh) and records the upload in `BudgetUploadHistory` with timestamp and row count.
- **R4.** System rejects malformed uploads (missing columns, unparseable rows) with a clear Bahasa Indonesia error message identifying the issue.

**Dashboard view**
- **R5.** Kepala and Sekretaris can sign in via email + password.
- **R6.** Dashboard shows: total Anggaran, total Realisasi, % serapan, breakdown by Kelompok Belanja (Operasi / Modal / Tak Terduga / Transfer), top 10 Program by anggaran, top/bottom 5 Program by % serapan. Fits a 1440px screen without scroll.
- **R7.** Dashboard shows a "Terakhir diperbarui" timestamp tied to the latest budget upload.
- **R8.** Dashboard initial load completes in under 3 seconds.

**Auth & access**
- **R9.** Passwords hashed with argon2id. Sessions are signed cookies.
- **R10.** Admin access (`/admin/*`) gated separately from dashboard access — only the uploader account can upload.

**Operational**
- **R11.** Service exposes `/healthz` returning 200 when the database is reachable.
- **R12.** Application errors logged with timestamp, route, and stack; sensitive data is not logged.

## Key Technical Decisions

- **TanStack Start full-stack** — UI and server functions in one app. No separate API service for a small-user dashboard.
- **Prisma + Postgres** — typed queries, easy migrations.
- **Module-driven structure** — budget, employee, asset are isolated. Each module owns its routes, server functions, components, and Prisma models. Cross-module imports are forbidden.
- **Manual upload, not API integration** — the assumption that makes a 4-week solo timeline feasible. Revisit when SIPD API access is confirmed.
- **Full-refresh upload per module** — simpler than diff logic, suitable for weekly/monthly refresh cadence.
- **Store all hierarchical LRA rows with a `level` field** — Program, Kegiatan, Sub Kegiatan, Rekening all persist, with `parent_kode` for relationships. Aggregation queries filter by level.
- **Recharts for charts** — React-native, well-documented, no learning curve. No D3 in v1.
- **Server-side aggregation** — dashboard calls server functions that return pre-aggregated numbers, not raw rows.
- **Seed three users** — Kepala, Sekretaris, Uploader. No registration flow in v1.
- **No file storage** — uploaded LRA files are parsed on receipt and discarded. Only parsed rows persist.
- **Indonesian cloud VPS** — data sovereignty requirement for government data. Niagahoster, IDCloudHost, or Biznet Gio.

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | TanStack Start | Full-stack: UI + server functions |
| Language | TypeScript 5.5+ | Strict mode |
| Runtime | Node.js 20 LTS | |
| Package manager | pnpm 9+ | |
| Database | Postgres 16 | Self-hosted on VPS |
| ORM | Prisma 5 | |
| File parsing | xlsx (SheetJS) | Excel parsing |
| Charts | Recharts | |
| UI | Tailwind + shadcn/ui | Minimal primitive set |
| Auth | argon2id + signed session cookie | iron-session or equivalent |
| Validation | Zod | Env, upload schemas, server function inputs |
| Logging | Pino | Structured JSON |
| Deployment | Indonesian VPS | Single region |

## Implementation Units

Six units across four weeks. Solo, sequential, each a PR to `main`.

### U1. Scaffolding, shared tooling, module structure (Days 1–4)
- **Goal:** Stand up the TanStack Start project, Postgres via Docker Compose, Prisma schema for the budget module, ESLint with cross-module import rule, seed script for three users.
- **Requirements:** Foundational
- **Files:**
  - `package.json`, `pnpm-workspace.yaml` (single-app workspace), `tsconfig.json`, `app.config.ts`
  - `docker-compose.yml` (Postgres 16)
  - `prisma/schema.prisma` — `User`, `BudgetRealization`, `BudgetUploadHistory`
  - `prisma/seed.ts` — Kepala, Sekretaris, Uploader
  - `.eslintrc.cjs` with `no-restricted-imports` rule preventing cross-module imports
  - `src/modules/budget/README.md`, `src/modules/budget/index.ts` (empty exports stub)
  - `src/shared/db/index.ts` (Prisma client singleton)
  - `src/shared/lib/format.ts` (`formatIDR`, `formatDateID` stubs)
  - `src/routes/__root.tsx`, `src/routes/index.tsx` (placeholder landing in Bahasa)
  - `.github/workflows/ci.yml` (lint + typecheck + test)
  - `README.md` (root)
- **Approach:** Single-app project (not a monorepo — overkill for solo). Prisma schema for budget module defined in U1 because seed needs it. Employee and asset Prisma models added in their respective version units. ESLint rule is the enforcement mechanism for the module boundary; without it, "module-driven" is just a folder convention.
- **Test scenarios:** `pnpm install` clean; `pnpm dev` boots; visiting `/` shows the placeholder; `prisma migrate dev` creates the tables; seed creates three users; an intentional cross-module import fails lint.
- **Verification:** All commands above pass; CI is green on first PR.

### U2. Authentication module in `shared/auth` (Days 5–6)
- **Goal:** Email + password login with argon2id hashing, signed session cookie, logout, auth-gated routes.
- **Requirements:** R5, R9, R10
- **Files:**
  - `src/shared/auth/password.ts` (argon2id hash + verify)
  - `src/shared/auth/session.ts` (cookie signing, parsing)
  - `src/shared/auth/middleware.ts` (route guards: `requireUser`, `requireUploader`)
  - `src/routes/auth/login.tsx`, `src/routes/auth/logout.tsx`
  - `src/routes/dashboard/_layout.tsx` (calls `requireUser` in `beforeLoad`)
  - `src/routes/admin/_layout.tsx` (calls `requireUploader` in `beforeLoad`)
- **Approach:** Auth lives in `shared/`, not a module, because all modules and routes use it. Two guards: `requireUser` (any logged-in account) for the dashboard, `requireUploader` (uploader role only) for admin. Session is a signed cookie carrying `userId` + `role`.
- **Test scenarios:** Correct password → session set; wrong password → error in Bahasa; logged-out user visiting `/dashboard` → redirect to `/auth/login`; Kepala visiting `/admin/upload` → 403 / forbidden page.
- **Verification:** Manual login as all three accounts; access control behaves as documented.

### U3. Budget module: LRA parser + upload pipeline (Days 7–12)
- **Goal:** Uploader can upload an LRA Excel file; parser handles hierarchical structure; valid rows replace the prior dataset; errors return readable Bahasa messages; upload history records every attempt.
- **Requirements:** R1, R2, R3, R4
- **Files:**
  - `src/modules/budget/schema.ts` (Zod schemas for LRA row, parser config)
  - `src/modules/budget/types.ts` (`BudgetLevel`, `KelompokBelanja`)
  - `src/modules/budget/server/parse-lra.ts` (header detection, level detection, row parsing)
  - `src/modules/budget/server/upload-lra.ts` (transaction: parse → validate → deleteMany → createMany → record history)
  - `src/modules/budget/server/upload-history.ts` (query helpers)
  - `src/modules/budget/index.ts` (re-export public functions: `uploadLRA`, `getUploadHistory`)
  - `src/routes/admin/upload/index.tsx` (single upload widget for budget; will fan out to multiple modules later)
  - `src/modules/budget/README.md` (document LRA schema, header rows, code level regex)
  - `tests/modules/budget/parse-lra.test.ts`
- **Approach:** The LRA file from SIPD has 3 header rows (title + 2 merged subheader rows) before data starts. Parser skips those, detects level from `kode` regex (e.g. `^5\.\d{2}\.\d{2}$` = Program, `^5\.\d{2}\.\d{2}\.\d\.\d{2}$` = Kegiatan, etc.). Each row stores: `kode`, `parent_kode` (computed from code structure), `level`, `uraian`, and anggaran/realisasi values for each Kelompok Belanja (Operasi, Modal, Tak Terduga, Transfer). Total columns are derived in aggregation queries, not stored. The whole upload runs in a Prisma transaction so a parse failure rolls back the deleteMany.
- **Test scenarios:**
  - Happy: real LRA sample file uploads end-to-end, row count matches manual count of non-header rows.
  - Edge: missing required column → Bahasa error names the missing column.
  - Edge: empty file → clear error.
  - Edge: row with unrecognized code format → skipped with warning logged, upload continues.
  - Edge: large file (10k rows) → completes in under 10 seconds.
  - Edge: parse failure mid-file → transaction rolls back, prior data intact.
- **Verification:** The real LRA file uploads correctly; total anggaran at UNSUR level matches the file's UNSUR row.

### U4. Budget module: aggregation server functions (Days 13–15)
- **Goal:** Server functions that return pre-aggregated dashboard data — overall totals, breakdown by Kelompok Belanja, top Programs.
- **Requirements:** R6, R7, R8
- **Files:**
  - `src/modules/budget/server/aggregate-summary.ts` (total Anggaran, total Realisasi, % serapan, last updated)
  - `src/modules/budget/server/aggregate-by-kelompok.ts` (breakdown by Kelompok Belanja)
  - `src/modules/budget/server/aggregate-top-programs.ts` (top 10 by anggaran, top/bottom 5 by % serapan)
  - `src/modules/budget/index.ts` updated to re-export these
  - `tests/modules/budget/aggregate.test.ts`
- **Approach:** Each function returns a typed result shape suitable for direct chart consumption. All queries filter on `level` (e.g. summary queries filter `level = 'UNSUR'`, program rankings filter `level = 'PROGRAM'`) — this is the payoff for storing the `level` field in U3. `lastUpdatedAt` comes from `BudgetUploadHistory`.
- **Test scenarios:** Each function returns expected shape against seeded test data; empty budget table → zeros with `lastUpdatedAt: null`; large dataset (10k rows) → completes < 500ms.
- **Verification:** Call from a quick test route; numbers spot-check against manual sums in the source LRA file.

### U5. Dashboard UI (Days 16–22)
- **Goal:** `/dashboard` renders the budget summary with charts, top-program tables, and "Terakhir diperbarui" timestamp. Fits a 1440px screen without scroll. All text in Bahasa Indonesia.
- **Requirements:** R6, R7, R8
- **Files:**
  - `src/routes/dashboard/index.tsx` (composes the page from budget module components)
  - `src/modules/budget/components/SummaryCards.tsx` (3 big-number cards: Anggaran, Realisasi, % Serapan)
  - `src/modules/budget/components/KelompokBelanjaChart.tsx` (Recharts bar chart)
  - `src/modules/budget/components/TopProgramsTable.tsx` (sortable table)
  - `src/modules/budget/components/SerapanRanking.tsx` (top/bottom 5 by % serapan)
  - `src/shared/lib/format.ts` (finalize `formatIDR`, `formatDateID`)
- **Approach:** Grid layout — top row: 3 summary cards full-width. Middle row: Kelompok Belanja chart (left, 60%) + Serapan ranking (right, 40%). Bottom row: Top Programs table full-width. Each section has its own loading state and "Terakhir diperbarui" subtitle. All currency via `formatIDR()`, all dates via `formatDateID()`.
- **Test scenarios:** Dashboard renders with real data; layout holds at 1440px and 1920px; loading skeleton appears before data; total page load under 3 seconds; all text in Bahasa.
- **Verification:** Kepala BKAD opens the dashboard on her actual laptop and the numbers are correct, current, and readable.

### U6. Deploy to Indonesian VPS, monitoring, handover (Days 23–28)
- **Goal:** Production deployment on a chosen Indonesian VPS, structured logging, error tracking, `/healthz` endpoint, user testing with Kepala and Sekretaris, one-page Bahasa user guide.
- **Requirements:** R11, R12
- **Files:**
  - `Dockerfile` (multi-stage build)
  - `docker-compose.prod.yml` (app + postgres + nginx reverse proxy with HTTPS via Let's Encrypt)
  - `src/routes/healthz.tsx`
  - `src/shared/lib/sentry.ts` (or GlitchTip — pick during U6)
  - `.env.production.example`
  - `docs/deploy.md` (deploy runbook)
  - `docs/user-guide.md` (one-page guide for Kepala/Sekretaris, in Bahasa)
  - `README.md` (root — final version)
- **Approach:** VPS choices to evaluate at U6 start: Niagahoster Cloud VPS, IDCloudHost, Biznet Gio. Pick based on price and Postgres support. Deploy via Docker Compose for simplicity (no Kubernetes). HTTPS via Let's Encrypt + nginx. Sentry free tier for error tracking (or GlitchTip self-hosted alongside the app if data sensitivity rules out external services — confirm with BKAD IT).
- **Test scenarios:** `/healthz` returns 200 in prod; forced test error appears in Sentry; deploy a small change, observe it land; rollback works.
- **Verification:** Kepala opens the production URL from her workstation, signs in, sees the dashboard. User testing session reveals top 3 confusion points; fix them.

## Day Allocation

| Week | Days | Focus |
|---|---|---|
| 1 | 1–7 | U1 scaffolding (1–4), U2 auth (5–6), buffer (7) |
| 2 | 8–14 | U3 LRA parser + upload (7–12), start U4 (13–14) |
| 3 | 15–21 | Finish U4 (15), U5 dashboard UI (16–21) |
| 4 | 22–28 | U5 finish (22), U6 deploy + testing + handover (23–28) |

## Risk Analysis

- **LRA format changes between months.** SIPD may add columns or change headers. *Mitigation:* parser must tolerate minor variation; show clear errors when parsing fails, don't crash. After each successful LRA upload, log the column signature so format drift is visible.
- **Source data is dirty.** Realisasi doesn't reconcile, freeform text in uraian, etc. *Mitigation:* v1 shows what's uploaded; reconciliation is explicitly out of scope. Document this so blame doesn't land on the dashboard for upstream data issues.
- **Scope creep from Kepala after launch.** "Just add one more thing." *Mitigation:* the Non-Goals list is visible; everything new is v1.1 candidate, not v1 addition. Employee and asset modules ship as v1.1 / v1.2 in their planned slot.
- **Solo dev slippage.** 4 weeks is tight for one person. *Mitigation:* if behind by Day 22, drop U6's user guide polish before dropping U6 deploy. Never drop U2 (auth) or U6 (deploy) — those are launch-blocking.
- **Deploy environment unknowns on VPS.** Postgres setup, HTTPS, domain. *Mitigation:* spike a deploy on Day 1 alongside U1 — push a "hello world" container to chosen VPS, get HTTPS working. This de-risks Day 23.
- **Data sovereignty / cloud restrictions.** Confirm with BKAD IT/Hukum that an Indonesian VPS satisfies internal rules. *Mitigation:* ask this on Day 1, not Day 23.

## Verification Strategy

End-to-end checks before launch:

1. **Cold start path** — Kepala opens URL, signs in, sees current LRA data in under 3 seconds.
2. **Upload path** — uploader signs in, uploads a fresh LRA Excel, sees row count confirmed, signs out, signs in as Kepala, sees updated numbers and updated timestamp.
3. **Error path** — uploader attempts a malformed file; gets a Bahasa error; prior dataset is intact.
4. **Auth path** — logged-out user is redirected from `/dashboard`; Kepala is rejected from `/admin/*`.
5. **Deploy path** — push a change, verify it lands in prod, verify `/healthz` returns 200.
6. **Module isolation check** — attempt a cross-module import in code; ESLint fails. This proves the module boundary is enforced, not just convention.

## Carried Forward to v1.1 and v1.2

When sample data is available:

- **v1.1 — Employee module**: parser for SIMPEG export, schema for `Employee` and `EmployeeUploadHistory`, dashboard section composed into `/dashboard`. No changes to budget module code expected.
- **v1.2 — Asset module**: same pattern for BMD data.

The module structure is specifically designed so each can ship as an isolated PR — new folder, new Prisma models, new dashboard components — without touching the budget module. This is the architectural payoff of doing module-driven from day one.

## Outstanding Questions

- [Resolve before Day 1] Confirm Indonesian VPS choice with BKAD IT and verify data sovereignty rules permit it.
- [Resolve before Day 1] Confirm domain name for production deployment.
- [Resolve during U3] Final regex patterns for code level detection — to be locked in against the actual LRA sample on first parse run.
- [Resolve during U6] Sentry free tier vs self-hosted GlitchTip — depends on whether external error tracking is permitted for government data.
