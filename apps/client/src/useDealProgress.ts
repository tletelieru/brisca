import { useEffect, useState } from 'react'
import type { PlayerCount } from '@brisca/engine'
import { dealTotal, landTime, trumpTime } from './lib/deal'
import { prefersQuickDraw } from './lib/dealerDraw'

export interface DealProgress {
  landed: number
  trumpUp: boolean
}

export function useDealProgress(players: PlayerCount, fresh: boolean, active: boolean): DealProgress {
  const total = dealTotal(players)
  const [progress, setProgress] = useState<DealProgress>(
    fresh ? { landed: 0, trumpUp: false } : { landed: total, trumpUp: true },
  )

  // eslint-disable-next-line local/no-effect -- lands the dealt packets card by card with setTimeout while the deal plays
  useEffect(() => {
    if (!active) return
    if (prefersQuickDraw()) {
      const timer = setTimeout(() => setProgress({ landed: total, trumpUp: true }), 0)
      return () => clearTimeout(timer)
    }
    const timers = Array.from({ length: total }, (_, index) =>
      setTimeout(() => setProgress({ landed: index + 1, trumpUp: false }), landTime(index, players)),
    )
    timers.push(setTimeout(() => setProgress({ landed: total, trumpUp: true }), trumpTime(players)))
    return () => timers.forEach(clearTimeout)
  }, [active, players, total])

  return progress
}
