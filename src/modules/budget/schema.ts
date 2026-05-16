import { BudgetLevel } from '@prisma/client'
import { z } from 'zod'

/** A monetary amount from the LRA. Non-finite values are rejected. */
const amount = z.number().finite()

/**
 * A single validated BudgetRealization row produced by the LRA parser,
 * ready to be persisted. Mirrors the `BudgetRealization` Prisma model
 * minus the database-generated `id` and `createdAt`.
 */
export const budgetRowSchema = z.object({
  kode: z.string().trim().min(1),
  parentKode: z.string().trim().min(1).nullable(),
  level: z.enum(BudgetLevel),
  uraian: z.string().trim().min(1),
  anggaranOperasi: amount,
  realisasiOperasi: amount,
  anggaranModal: amount,
  realisasiModal: amount,
  anggaranTakTerduga: amount,
  realisasiTakTerduga: amount,
  anggaranTransfer: amount,
  realisasiTransfer: amount,
})

export type BudgetRow = z.infer<typeof budgetRowSchema>

/**
 * A validated Sub Kegiatan → Sub Bidang mapping row, parsed from the
 * mapping spreadsheet (U7). Mirrors `BudgetSubBidangMapping` minus the
 * database-generated `id` and `createdAt`.
 */
export const subBidangRowSchema = z.object({
  subKegiatanKode: z.string().trim().min(1),
  bidang: z.string().trim().min(1),
  subBidang: z.string().trim().min(1),
})

export type SubBidangRow = z.infer<typeof subBidangRowSchema>
