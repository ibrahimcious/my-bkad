# BKAD Pasuruan Dashboard

Internal dashboard for the Head and Secretary of BKAD (Badan Keuangan dan Aset Daerah) Kabupaten Pasuruan. Consolidates budget realization, employee, and asset data from three separate sub-divisions into one read-only dashboard.

## Status

v1 in development. Scope is **budget data only** (LRA from SIPD Penatausahaan). Employee and asset modules will be added as v1.1 and v1.2 once sample data is available from Sub Bagian Umum dan Kepegawaian and Bagian Pengelolaan BMD.

## Users

- **Kepala BKAD** — head of the agency. Views the dashboard only.
- **Sekretaris BKAD** — same view access as the head.
- **Data uploader (admin)** — uploads fresh LRA exports. Has admin-only routes.

## Stack

- TanStack Start (full-stack, file-based routing)
- TypeScript 5.5+ strict mode
- Node.js 20 LTS, pnpm 9+
- PostgreSQL 16 + Prisma 5
- Tailwind CSS + shadcn/ui
- Recharts for visualization
- Zod for validation
- argon2id + signed session cookies for auth
- Pino for structured logging
- Vitest for testing
- xlsx (SheetJS) for parsing LRA Excel files

## Architecture: Module-Driven

Each business domain (budget, employee, asset) lives in its own self-contained folder under `src/modules/`. Modules MUST NOT import from each other. If two modules need to share something, that something belongs in `src/shared/`.

```
src/
├── modules/
│   ├── budget/                  # LRA data (v1)
│   │   ├── components/          # Budget-specific UI components
│   │   ├── server/              # Server functions: parsers, aggregators, queries
│   │   ├── schema.ts            # Zod schemas for upload validation
│   │   ├── types.ts             # Module-local TypeScript types
│   │   └── README.md            # What this module does, how to extend it
│   ├── employee/                # SIMPEG data (v1.1, deferred)
│   └── asset/                   # BMD data (v1.2, deferred)
├── routes/                      # Thin TanStack Start routes — import from modules
│   ├── __root.tsx
│   ├── index.tsx                # Landing
│   ├── auth/
│   ├── dashboard/               # Composes from modules (currently just budget)
│   └── admin/                   # Upload routes (currently just budget)
├── shared/                      # Cross-cutting concerns
│   ├── auth/                    # Session, password hashing
│   ├── db/                      # Prisma client singleton
│   ├── ui/                      # shadcn primitives (Button, Card, Input, Table)
│   └── lib/                     # Generic utilities (date formatting, currency)
└── styles/
    └── globals.css
```

### Module rules

1. **No cross-module imports.** A file in `modules/budget/` never imports from `modules/employee/`. Enforced by ESLint `no-restricted-imports` (configured in U1).
2. **Modules expose a public surface via index files.** `modules/budget/index.ts` re-exports only the public API. Internal helpers stay private to the folder.
3. **Routes are thin.** A route file orchestrates UI composition and delegates business logic to module server functions. Routes can import from multiple modules; modules cannot import from routes.
4. **Database tables are namespaced by module.** Prisma models for the budget module are prefixed (`BudgetRealization`, `BudgetUploadHistory`, etc.). When the employee module ships, its models will follow the same pattern.
5. **Module READMEs are required.** Each `modules/<name>/README.md` documents the module's data source, schema, parser quirks, and known limitations.

## Commands

- `pnpm dev` — boot dev server on localhost:3000
- `pnpm build` — production build
- `pnpm typecheck` — run TypeScript type checking (must pass before commit)
- `pnpm lint` — run ESLint (must pass before commit)
- `pnpm test` — run Vitest unit tests
- `docker compose up postgres -d` — start local Postgres in background
- `pnpm db:migrate` — apply Prisma migrations
- `pnpm db:seed` — seed initial users (Kepala, Sekretaris, Uploader)
- `pnpm db:studio` — open Prisma Studio for inspecting data

## Conventions

### Language
- All code, comments, variable names, commit messages, and internal docs in English.
- All user-facing UI text in Bahasa Indonesia (formal/professional, suitable for government).
- Error messages shown to users in Bahasa Indonesia. Error messages in logs in English.

### File naming
- React components: `PascalCase.tsx` (`BudgetSummaryCard.tsx`)
- Server functions, utilities, types: `kebab-case.ts` (`parse-lra.ts`, `aggregate-budget.ts`)
- Route files follow TanStack Start conventions (`__root.tsx`, `_layout.tsx`, `index.tsx`)

### TypeScript
- Strict mode is non-negotiable. No `any`. No `@ts-ignore` without a comment explaining why.
- Prefer Zod schemas as the source of truth — derive TypeScript types from Zod with `z.infer<>` rather than maintaining parallel types.

### Database
- All schema changes go through Prisma migrations, never raw SQL in production.
- Module models are prefixed by domain (`BudgetRealization`, not `Realization`).
- Encrypted fields use a dedicated helper, never raw `crypto`.

### Server functions
- Every server function validates input with Zod before touching the database.
- Server functions return typed results. Errors are thrown as typed error classes from `shared/lib/errors.ts`.
- Long-running operations (file parsing) log start, success, and failure with Pino.

### UI
- shadcn/ui primitives only from `src/shared/ui/`. Don't reinstall the same primitive into a module folder.
- Tailwind classes follow the order: layout → spacing → typography → color → state.
- Currency display uses the shared `formatIDR()` helper from `shared/lib/format.ts` — never inline `Intl.NumberFormat`.
- Dates display in `DD MMMM YYYY` format in Bahasa Indonesia (e.g. "15 Mei 2026") via the shared `formatDateID()` helper.

### Testing
- Every parser function has unit tests with at least: happy path, missing column, empty file, malformed row.
- Server function tests use a transactional rollback pattern against a test Postgres database.
- No mocking of Prisma — use a real test database. Setup is in `tests/setup.ts`.

### Git
- Commit messages: `<unit>: <imperative summary>` (e.g. "U3: add LRA header detection").
- One unit = one or more PRs to `main`. Branch naming: `u<N>-<short-description>` (e.g. `u3-lra-parser`).
- CI must pass on every PR. Don't merge with a red build.

## Working with Claude Code

When asking Claude Code to implement a task, the prompt should include:
1. Which unit (from `docs/plans/v1-plan.md`) the task belongs to.
2. Which module the change lives in, if any.
3. Explicit constraints — what NOT to do (e.g. "don't add Tailwind yet", "don't create `src/components/`").
4. Done-when criteria — concrete commands that should pass and observable behavior.

Always commit before starting a substantial task. Always review the diff before accepting. Always run typecheck and tests after.

## Reference

- Full project plan: `docs/plans/v1-plan.md`
- Module READMEs: `src/modules/<name>/README.md`
- LRA sample data: `docs/samples/LRA_Program_Jan_sd_12_Mei_26.xlsx`

