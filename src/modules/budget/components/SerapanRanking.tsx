import type { ProgramAggregate } from '../server/aggregations'

interface SerapanRankingProps {
  highest: ProgramAggregate[]
  lowest: ProgramAggregate[]
}

function RankingList({
  title,
  programs,
}: {
  title: string
  programs: ProgramAggregate[]
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {programs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Tidak ada data.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {programs.map((program) => (
            <li
              key={program.kode}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="truncate text-muted-foreground">
                {program.uraian}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
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
    <div className="space-y-5 rounded-lg border bg-card p-5">
      <RankingList title="Serapan Tertinggi" programs={highest} />
      <RankingList title="Serapan Terendah" programs={lowest} />
    </div>
  )
}
