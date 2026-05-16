# BKAD Pasuruan Dashboard

Internal dashboard for the Head and Secretary of BKAD (Badan Keuangan dan
Aset Daerah) Kabupaten Pasuruan. Consolidates budget realization data into
one read-only dashboard.

> **Status:** v1 in development — scope is budget data (LRA) only.

See [`CLAUDE.md`](./CLAUDE.md) for the full project overview and
[`docs/plans/v1-plan.md`](./docs/plans/v1-plan.md) for the v1 plan.

## Prerequisites

- Node.js 20 LTS (see [`.nvmrc`](./.nvmrc))
- pnpm 9+ — `corepack enable` provides the pinned version
- Docker — for the local PostgreSQL database

## Setup

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
