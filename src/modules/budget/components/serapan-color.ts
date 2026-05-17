/**
 * Tailwind text-colour class for a serapan (budget absorption)
 * percentage — green when healthy, amber when lagging, red when low.
 * Shared by the Sub Kegiatan list and detail tables.
 */
export function serapanColor(pct: number): string {
  if (pct >= 85) return 'text-green-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}
