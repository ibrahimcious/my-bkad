# BKAD Pasuruan Dashboard

Internal dashboard for the Head (Kepala) and Secretary (Sekretaris) of
BKAD (Badan Keuangan dan Aset Daerah) Kabupaten Pasuruan. It consolidates
budget realization (LRA) data from SIPD Penatausahaan into one read-only
dashboard, refreshed by manual Excel upload.

> **Status:** v1 — budget module complete. Employee and asset modules are
> deferred to v1.1 and v1.2.

See [`CLAUDE.md`](./CLAUDE.md) for the full project overview and
[`docs/plans/v1-plan.md`](./docs/plans/v1-plan.md) for the v1 plan.

## What it does

- Email + password sign-in for three accounts: Kepala, Sekretaris, and a
  data uploader (admin).
- The uploader refreshes data on `/admin/upload` by uploading an LRA Excel
  export; each upload fully replaces the prior dataset.
- `/dashboard` shows total Anggaran, Realisasi and % Serapan, a Kelompok
  Belanja chart, and program rankings — all in Bahasa Indonesia.

## Prerequisites

- Node.js 20 LTS (see [`.nvmrc`](./.nvmrc))
- pnpm 9+ — `corepack enable` provides the pinned version
- Docker — for the local PostgreSQL database

## Local setup

```bash
pnpm install                     # install dependencies
cp .env.example .env             # local environment config
docker compose up postgres -d    # start PostgreSQL 16
pnpm db:migrate                  # apply database migrations
pnpm db:seed                     # seed the three user accounts
pnpm dev                         # dev server on http://localhost:3000
```

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server (localhost:3000) |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build (after `pnpm build`) |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest unit tests |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed initial users |
| `pnpm db:studio` | Open Prisma Studio |

## Architecture

Module-driven: each business domain (currently `budget`) is a
self-contained module under `src/modules/`. Modules must not import from
each other — cross-cutting code lives in `src/shared/`, and the boundary
is enforced by ESLint. See [`CLAUDE.md`](./CLAUDE.md) for the full
conventions.

## Deployment

The production stack (PostgreSQL + app + nginx) runs via Docker Compose.
The full runbook — first deploy, HTTPS, updates, rollback, backups — is in
[`docs/deploy.md`](./docs/deploy.md).

## Documentation

- [`docs/deploy.md`](./docs/deploy.md) — production deployment runbook
- [`docs/user-guide.md`](./docs/user-guide.md) — user guide for Kepala and
  Sekretaris (Bahasa Indonesia)
- [`src/modules/budget/README.md`](./src/modules/budget/README.md) — the
  budget module, including the LRA file format
- [`docs/plans/v1-plan.md`](./docs/plans/v1-plan.md) — the v1 plan
