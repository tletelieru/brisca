import type { CSSProperties } from 'react'
import type { PlayerCount } from '@brisca/engine'
import { dealTotal, launchTime, seatForCard } from '../lib/deal'
import { SEAT_VECTOR, seatPosition } from '../lib/cards'

export function DealAnimation({ players, dealer }: { players: PlayerCount; dealer: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed top-1/2 left-1/2 z-10">
      {Array.from({ length: dealTotal(players) }, (_, index) => {
        const vector = SEAT_VECTOR[seatPosition(seatForCard(index, dealer, players), players)]
        const style = {
          '--to-x': `${vector.x}px`,
          '--to-y': `${vector.y}px`,
          '--delay': `${launchTime(index, players)}ms`,
        } as CSSProperties
        return <span key={index} style={style} className="deal-flight card-back" />
      })}
    </div>
  )
}
