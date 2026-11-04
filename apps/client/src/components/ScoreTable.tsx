import type { CSSProperties } from 'react'
import { useMessages } from '../i18n/messages'

interface Props {
  names: string[]
  points: number[]
  tricks: number[]
  winners?: number[]
  details?: string[]
}

export function ScoreTable({ names, points, tricks, winners = [], details = [] }: Props) {
  const t = useMessages()
  const top = Math.max(1, ...points)

  return (
    <table className="w-full table-fixed border-separate [border-spacing:0.25rem]">
      <thead>
        <tr className="text-xs text-muted">
          <th scope="col" className="w-auto text-left font-normal">
            {t.player}
          </th>
          <th scope="col" className="w-16 font-normal">
            {t.tricksTitle}
          </th>
          <th scope="col" className="w-20 font-normal">
            {t.pointsTitle}
          </th>
        </tr>
      </thead>
      <tbody>
        {names.map((name, side) => {
          const leading = winners.includes(side)
          const fill = { '--fill': `${(points[side] / top) * 100}%` } as CSSProperties
          return (
            <tr key={name}>
              <th
                scope="row"
                className={`pixel-box bg-raised px-2 py-1.5 text-left font-normal ${
                  leading ? 'shadow-[inset_0_0_0_2px_var(--gold)]' : ''
                }`}
              >
                <span className="block truncate text-sm">{name}</span>
                {details[side] && <span className="block text-xs leading-tight text-muted">{details[side]}</span>}
                <span style={fill} className="score-bar mt-1 block h-1.5" />
              </th>
              <td className="pixel-box bg-raised/60 text-center font-pixel text-2xl leading-none tabular-nums">
                {tricks[side]}
              </td>
              <td className="pixel-box bg-raised text-center font-pixel text-3xl leading-none tabular-nums">
                {points[side]}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
