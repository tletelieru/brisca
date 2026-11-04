import { useContext, useEffect, useEffectEvent, useState } from 'react'
import type { PlayerCount, Seat } from '@brisca/engine'
import { REVEAL_MS, drawSequence, prefersQuickDraw } from './lib/dealerDraw'
import { DRAW_SOUNDS, SfxContext } from './lib/sound'
import type { DrawEvent } from './lib/sound'

export type DrawPhase = 'hopping' | 'reveal' | 'done'

export function useDealerDraw(players: PlayerCount, dealer: Seat, active: boolean) {
  const sfx = useContext(SfxContext)
  const [phase, setPhase] = useState<DrawPhase>(active ? 'hopping' : 'done')
  const [spot, setSpot] = useState<Seat | null>(null)
  const sound = useEffectEvent((event: DrawEvent) => sfx?.play(DRAW_SOUNDS[event]))

  // eslint-disable-next-line local/no-effect -- runs the timed hops of the dealer draw with setTimeout
  useEffect(() => {
    if (!active) return
    const steps = prefersQuickDraw() ? [{ seat: dealer, at: 0 }] : drawSequence(players, dealer)
    const last = steps.length - 1
    const timers = steps.map((step, index) =>
      setTimeout(() => {
        setSpot(step.seat)
        if (index < last) return sound('hop')
        sound('stop')
        setPhase('reveal')
      }, step.at),
    )
    timers.push(
      setTimeout(() => {
        setSpot(null)
        setPhase('done')
      }, steps[last].at + REVEAL_MS),
    )
    return () => timers.forEach(clearTimeout)
  }, [active, players, dealer])

  return { phase, spot }
}
