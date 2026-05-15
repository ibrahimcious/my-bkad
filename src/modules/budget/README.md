# Budget Module

LRA (Laporan Realisasi Anggaran) data for the BKAD Pasuruan dashboard — v1.

## Data source

Budget realization is exported from **SIPD Penatausahaan** as an Excel file
(the "LRA per Program" report). The current sample lives at
`docs/samples/LRA_Program_Jan_sd_12_Mei_26.xlsx`. There is no API
integration in v1 — data is refreshed by manual upload on `/admin/upload`.

## Database

Prisma models (see `prisma/schema.prisma`), all prefixed `Budget`:

- `BudgetRealization` — one row per LRA line. The full hierarchy is stored
  (every level), linked by `parentKode`, with the row's `level` recorded.
- `BudgetUploadHistory` — audit record of every upload attempt.

Each upload is a full refresh: the prior dataset is deleted and replaced.

## Public API

Consumers import only from `src/modules/budget/index.ts`. Internal files
(`server/`, `components/`) are private to the module.

This module **must not import from other modules** (`employee`, `asset`)
or from `routes/`. Shared code belongs in `src/shared/`. The boundary is
enforced by ESLint (`eslint.config.js`, `no-restricted-imports`).

## Status

U1 scaffolding only. Not yet implemented:

- LRA parser — header detection, code-level regex (U3)
- Upload pipeline — parse → validate → full refresh → record history (U3)
- Aggregation server functions (U4)
- Dashboard components (U5)

## Parser quirks & known limitations

To be documented in U3 against the real LRA sample: the 3-row header
(title + 2 merged subheader rows), the hierarchical `kode` structure, and
the regex patterns used to detect each code level.
