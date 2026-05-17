# Budget Module

LRA (Laporan Realisasi Anggaran) data for the BKAD Pasuruan dashboard — v1.

## Data source

Budget realization is exported from **SIPD Penatausahaan** as an Excel file
(the "LRA per Program" report). The canonical sample lives at
`docs/samples/LRA Per Program-17-5-2026.xlsx` — an **unedited** export
downloaded straight from SIPD. There is no API integration in v1 — data is
refreshed by manual upload on `/admin/upload`.

> **Do not edit the sample in Excel before using it as a fixture.** Opening
> and re-saving an LRA export can silently coerce its text-typed amount
> cells into native numbers and rewrite them in the host machine's locale.
> The parser is built against the *raw* SIPD format described below; a
> re-saved file is not representative.

## Database

Prisma models (see `prisma/schema.prisma`), all prefixed `Budget`:

- `BudgetRealization` — one row per stored LRA line, linked by `parentKode`,
  with the row's `level` recorded. Each row carries an Anggaran and a
  Realisasi amount for all four Kelompok Belanja (Operasi, Modal, Tak
  Terduga, Transfer).
- `BudgetUploadHistory` — audit record of every upload attempt.
- `BudgetSubBidangMapping` — maps each Sub Kegiatan to a Sub Bidang (U7).
  Reference data, keyed by the stable `subKegiatanKode`, so it survives
  the `BudgetRealization` full refresh.

Each LRA upload is a full refresh: the prior dataset is deleted and
replaced, inside a single transaction (see `server/upload-lra.ts`). The
Sub Bidang mapping is uploaded and refreshed separately.

## Public API

Consumers import only from `src/modules/budget/index.ts` — server
functions for upload, aggregation, and the Sub Bidang mapping, plus the
dashboard components. Internal files (`server/`, `components/`) are
private to the module.

This module **must not import from other modules** (`employee`, `asset`)
or from `routes/`. Shared code belongs in `src/shared/`. The boundary is
enforced by ESLint (`eslint.config.js`, `no-restricted-imports`).

## LRA file format

Documented against the real SIPD export. The parser lives in
`server/parse-lra.ts`; tests in `tests/modules/budget/parse-lra.test.ts`.

### Header

The sheet opens with **nine non-data rows**, not the three the v1 plan
assumed: four title rows, one blank row, a "Kelompok Belanja" group-header
row, an Anggaran/Realisasi sub-header row, and a column-numbering row. The
parser does **not** hardcode this count — it classifies every row and
keeps only those that look like data (see below), so extra or missing
title rows do not break it.

### Columns

| Column | Content |
|--------|---------|
| A–D    | Hierarchical `kode`, spread across four columns (see below) |
| E      | `uraian` (description) |
| F–G    | Operasi — Anggaran, Realisasi |
| H–I    | Modal — Anggaran, Realisasi |
| J–K    | Tak Terduga — Anggaran, Realisasi |
| L–M    | Transfer — Anggaran, Realisasi |
| N–P    | Jumlah (Anggaran, Realisasi) and % — **not stored**, derived in aggregation |

### Amount cells

This is the most error-prone part of the format. SIPD exports every
monetary cell (columns F–M) as **text**, not as a number:

- The cell type is `s` (string), e.g. the literal `"36.387.492.566,45"`.
- Numbers use **Indonesian locale**: `.` is the thousands separator and
  `,` is the decimal separator. Every value carries two decimal places.
- Zero is written as the text `"0,00"`.

`parseAmount` in `parse-lra.ts` normalises this — it strips the `.`
thousands separators, converts the `,` decimal to `.`, and parses the
result. It also accepts native numeric cells (a file re-saved through
Excel may have its text amounts coerced to numbers) and accounting-style
negatives like `"(1.234,00)"`. A non-empty cell it cannot read yields no
silent zero: the whole row is skipped with a warning.

> Reading these cells with `Number()` or a US-locale parser misreads
> every value catastrophically (`"36.387.492.566,45"` → `36.387`). The
> v1 parser was first built against a sample that had been re-saved in
> Excel, hiding this; see the regression test in
> `tests/modules/budget/parse-lra.test.ts`.

### Hierarchy and level detection

The code is **not** in a single column. Columns A–D each hold one tier of
the hierarchy and carry their value downward as ancestor context. A row's
own `kode` is the value in the **rightmost filled** of columns A–D. The
level follows from which column that is, plus the code's segment depth:

| Column | Segment depth | Level |
|--------|---------------|-------|
| A      | 1 (`5`)              | `UNSUR` |
| A      | 2 (`5.02`)           | Urusan — **skipped** |
| B      | any (`5.02.0.00…`)   | Organisasi — **skipped** |
| C      | 3 (`5.02.01`)        | `PROGRAM` |
| C      | 5 (`5.02.01.2.01`)   | `KEGIATAN` |
| C      | 6 (`5.02.01.2.01.0001`) | `SUB_KEGIATAN` |
| D      | any (`5.1.02…`)      | `REKENING` |

`parentKode` is resolved from running ancestor context: PROGRAM → UNSUR,
KEGIATAN → PROGRAM, SUB_KEGIATAN → KEGIATAN, REKENING → SUB_KEGIATAN.

### Known limitations

- **Urusan and Organisasi rows are dropped.** They duplicate the UNSUR
  grand total for this single-agency file, and the `BudgetLevel` enum has
  no value for them. If the file ever covers multiple agencies this must
  be revisited.
- **`kode` is not unique.** Rekening codes (e.g. `5.1.02`) repeat under
  every Sub Kegiatan, so `parentKode` for a REKENING row identifies its
  Sub Kegiatan but rekening-to-rekening nesting is not modelled. Rekening
  drill-down is out of scope for v1.
- A row with a code in an unexpected column/depth is skipped with a
  warning (surfaced in upload history and logs), and parsing continues.

## Sub Bidang mapping (U7)

Each Sub Kegiatan can be attributed to a BKAD **Sub Bidang** so the
dashboard can show realisation per Sub Bidang. The mapping is *reference
data* — it does not change between LRA uploads — so it is not part of the
LRA file. It is uploaded separately on `/admin/sub-bidang` from a mapping
spreadsheet (see `docs/samples/subbidang.xlsx`: columns C / D / E hold the
Sub Kegiatan code, Bidang, and Sub Bidang). The file is denormalised and
is deduplicated by `kode` on import.

The mapping is stored in `BudgetSubBidangMapping`, keyed by the stable
`subKegiatanKode`, so it survives every LRA full refresh. The dashboard
joins Sub Kegiatan rows to it by `kode`; any Sub Kegiatan with no mapping
rolls up under "Belum ditetapkan".

## Status

All of v1 plus U7 is implemented: LRA parser and upload pipeline (U3),
aggregation server functions (U4), dashboard UI (U5), and the Sub Bidang
mapping and per-Sub-Bidang view (U7).
