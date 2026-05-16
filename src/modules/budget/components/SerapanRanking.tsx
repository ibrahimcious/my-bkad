import type { BudgetLineAggregate } from '../server/aggregations'

interface SerapanRankingProps {
  highest: BudgetLineAggregate[]
  lowest: BudgetLineAggregate[]
}

function RankingList({
  title,
  programs,
}: {
  title: string
  programs: BudgetLineAggregate[]
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-obsidian">
        {title}
      </h3>
      {programs.length === 0 ? (
        <p className="mt-2 text-sm text-steel">Tidak ada data.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {programs.map((program) => (
            <li
              key={program.kode}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="truncate text-steel">{program.uraian}</span>
              <span className="shrink-0 font-semibold tabular-nums text-obsidian">
                {program.persentaseSerapan.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Programs with the highest and lowest budget realisation (% serapan). */
export function SerapanRanking({ highest, lowest }: SerapanRankingProps) {
  return (
    <div className="space-y-5 rounded-card border border-fog bg-snow p-6">
      <RankingList title="Serapan Tertinggi" programs={highest} />
      <RankingList title="Serapan Terendah" programs={lowest} />
    </div>
  )
}
