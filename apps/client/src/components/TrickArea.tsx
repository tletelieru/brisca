import type { CSSProperties } from 'react'
import { trickWinner } from '@brisca/engine'
import type { Play, PlayerCount, Seat, Suit } from '@brisca/engine'
import { SEAT_VECTOR, seatPosition } from '../lib/cards'
import type { SeatPosition } from '../lib/cards'
import { HUMAN } from '../useMatch'
import { FlipCard } from './FlipCard'
import { SpanishCard } from './SpanishCard'

interface Props {
  plays: Play[]
  players: PlayerCount
  trump: Suit
  collectedBy: Seat | null
  hints: boolean
}

const PLACE: Record<SeatPosition, string> = {
  bottom: 'bottom-0 left-1/2 -translate-x-1/2',
  right: 'right-0 top-1/2 -translate-y-1/2',
  top: 'top-0 left-1/2 -translate-x-1/2',
  left: 'left-0 top-1/2 -translate-y-1/2',
}

export function TrickArea({ plays, players, trump, collectedBy, hints }: Props) {
  const leading = hints && plays.length > 0 ? trickWinner(plays, trump) : null
  const target = collectedBy === null ? null : SEAT_VECTOR[seatPosition(collectedBy, players)]
  const collect = target
    ? ({ '--to-x': `${target.x}px`, '--to-y': `${target.y}px` } as CSSProperties)
    : undefined

  return (
    <div className="relative mx-auto h-60 w-full max-w-60">
      {plays.map(({ seat, card }) => {
        const position = seatPosition(seat, players)
        const from = SEAT_VECTOR[position]
        const enter = { '--from-x': `${from.x}px`, '--from-y': `${from.y}px` } as CSSProperties
        const marked = card.suit === trump
        return (
          <div key={seat} data-play={seat} className={`absolute ${PLACE[position]}`}>
            <div style={collect} className={target ? 'trick-collect' : ''}>
              {seat === HUMAN ? (
                <div style={enter} className="trick-enter">
                  <SpanishCard card={card} size="lg" highlight={seat === leading} marked={marked} />
                </div>
              ) : (
                <div style={enter} className="bot-enter">
                  <FlipCard card={card} size="lg" highlight={seat === leading} marked={marked} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
