# Domain & Architecture Glossary

The shared language of the BKAD Pasuruan dashboard. Use these terms exactly —
in code, comments, and discussion — so names stay stable. Domain terms come
from Indonesian local-government finance; architecture terms name the seams
the codebase is built around.

## Domain — APBD / SIPD

- **APBD** — Anggaran Pendapatan dan Belanja Daerah; the regional budget. Its
  three components are Pendapatan, Belanja, and Pembiayaan.
- **LRA** — Laporan Realisasi Anggaran; the budget-realisation report
  exported from SIPD Penatausahaan as an Excel file.
- **SIPD Penatausahaan** — the national system the LRA files are exported
  from. The only data source; there is no API integration.
- **Pendapatan** — revenue. SIPD account group `4`.
- **Belanja** — expenditure. SIPD account group `5`.
- **Pembiayaan** — financing. SIPD account group `6`.
- **Anggaran** — the budgeted amount (the plan / target).
- **Realisasi** — the amount actually collected or spent.
- **Serapan** — Belanja realisation as a percentage of its Anggaran.
- **Capaian** — Pendapatan realisation as a percentage of its target Anggaran.
- **Kelompok** — a tier of the hierarchy: Kelompok Belanja (Operasi, Modal,
  Tak Terduga, Transfer) or Kelompok Pendapatan (PAD, Transfer, …).
- **Sub Kegiatan** — a belanja hierarchy level; the unit a leader drills into
  for its Rekening detail.
- **Rekening** — a belanja line item — the most granular Belanja entry.
- **Sub Bidang** — a BKAD organisational unit a Sub Kegiatan is attributed to;
  reference data, mapped separately from the LRA.
- **BKAD** — Badan Keuangan dan Aset Daerah, the agency this dashboard serves.
- **Kabupaten** — the regency (Kabupaten Pasuruan). A *kabupaten-wide* figure
  spans the whole regency, as opposed to a per-OPD (BKAD-only) figure.

## Architecture — seams

- **Upload handler** — the single Module every upload pipeline passes through
  (`modules/budget/server/upload-handler.ts`). It owns the role gate,
  transaction, history write, and error mapping; callers supply only a
  parser and a persist step. See `createUploadFn`.
- **Upload kind** — which dataset an upload belongs to: `BELANJA`,
  `PENDAPATAN`, or `SUB_BIDANG`. One `BudgetUploadHistory` table records
  every pipeline's attempts, discriminated by kind.
- **Kabupaten LRA section total** — the kabupaten-wide grand total of a
  non-Pendapatan LRA section (Belanja or Pembiayaan), captured from the full
  LRA file so the dashboard overview can show the three APBD components
  together. Stored one row per section in `BudgetKabupatenLraTotal`.
