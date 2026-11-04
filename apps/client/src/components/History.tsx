import { useState } from 'react'
import { useLocale, useMessages } from '../i18n/messages'
import { readHistory } from '../lib/history'
import type { MatchRecord } from '../lib/history'
import { HUMAN_SEAT, playerNames } from '../lib/names'
import { Overlay } from './Overlay'
import { ScoreTable } from './ScoreTable'
import { SpanishSuitIcon } from './SpanishSuitIcon'

type Outcome = 'won' | 'tied' | 'lost' | 'abandoned'

function outcome(record: MatchRecord): Outcome {
  if (record.abandoned) return 'abandoned'
  if (!record.winners.includes(HUMAN_SEAT)) return 'lost'
  if (record.winners.length > 1) return 'tied'
  return 'won'
}

const TONE: Record<Outcome, string> = {
  won: 'bg-emerald-500/20',
  tied: 'bg-surface',
  lost: 'bg-rose-500/20',
  abandoned: 'bg-surface',
}

export function History({ onClose }: { onClose: () => void }) {
  const t = useMessages()
  const locale = useLocale()
  const [records] = useState(readHistory)
  const [openId, setOpenId] = useState<number | null>(null)
  const wins = records.filter((record) => outcome(record) === 'won').length

  return (
    <Overlay title={t.history} onClose={onClose}>
      {records.length === 0 ? (
        <p className="text-sm text-muted">{t.historyEmpty}</p>
      ) : (
        <>
          <p className="text-sm text-muted">{t.historySummary(records.length, wins)}</p>
          <ol className="flex flex-col gap-1.5">
            {records.map((record) => {
              const result = outcome(record)
              return (
                <li key={record.id} className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-expanded={openId === record.id}
                    onClick={() => setOpenId(openId === record.id ? null : record.id)}
                    className="pixel-box flex items-center justify-between gap-2 bg-raised px-3 py-2 text-left"
                  >
                    <span className="min-w-0 leading-tight">
                      <span className="block text-sm">
                        {new Date(record.finishedAt).toLocaleDateString(locale)} ·{' '}
                        {t.levels[record.level]} · {t.playerCount(record.players)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <SpanishSuitIcon suit={record.trump.suit} className="size-3" />
                        {t.outcomes[result]}
                      </span>
                    </span>
                    <span className={`pixel-box px-2 py-1 tabular-nums ${TONE[result]}`}>
                      {record.points[HUMAN_SEAT]}
                    </span>
                  </button>
                  {openId === record.id && (
                    <ScoreTable
                      names={playerNames(t, record.players)}
                      points={record.points}
                      tricks={record.tricks}
                      winners={record.winners}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </>
      )}
      <button type="button" onClick={onClose} className="pixel-box bg-raised py-2">
        {t.close}
      </button>
    </Overlay>
  )
}
