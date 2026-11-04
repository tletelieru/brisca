import type { Level } from '@brisca/bots'
import { score } from '@brisca/engine'
import type { Card, MatchState, PlayerCount } from '@brisca/engine'

export interface MatchRecord {
  id: number
  finishedAt: number
  players: PlayerCount
  level: Level
  trump: Card
  points: number[]
  tricks: number[]
  winners: number[]
  abandoned?: boolean
}

export const historyKey = 'match-history'

const MAX_RECORDS = 50

export function readHistory(): MatchRecord[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(historyKey) ?? '[]')
    if (!Array.isArray(saved)) return []
    return (saved as MatchRecord[]).filter(
      (record) =>
        (record?.players === 3 || record?.players === 4) &&
        Array.isArray(record.points) &&
        record.points.length === record.players,
    )
  } catch {
    return []
  }
}

export function saveRecord(record: MatchRecord): void {
  const history = readHistory()
  if (history.some((item) => item.id === record.id)) return
  localStorage.setItem(historyKey, JSON.stringify([record, ...history].slice(0, MAX_RECORDS)))
}

export function recordMatch(state: MatchState, seed: number, level: Level, abandoned: boolean): void {
  const result = score(state)
  saveRecord({
    id: seed,
    finishedAt: Date.now(),
    players: state.players,
    level,
    trump: state.trump,
    points: result.points,
    tricks: result.tricks,
    winners: abandoned ? [] : result.winners,
    ...(abandoned ? { abandoned } : {}),
  })
}
