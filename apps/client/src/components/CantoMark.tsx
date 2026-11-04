import type { Canto, Seat, Suit } from '@brisca/engine'
import { useMessages } from '../i18n/messages'
import { seatName } from '../lib/names'
import { SpanishCard } from './SpanishCard'

interface Props {
  canto: Canto
  owner: Seat
  trump: Suit
}

export function CantoMark({ canto, owner, trump }: Props) {
  const t = useMessages()
  const label = t.cantoOf(seatName(t, canto.seat), canto.points)
  const own = canto.seat === owner

  return (
    <span data-canto={own ? 'own' : 'other'} title={label} aria-label={label} className="relative inline-block">
      {own ? (
        <SpanishCard card={canto.card} size="sm" highlight marked={canto.card.suit === trump} />
      ) : (
        <span className="card-shadow block">
          <span className="block h-11 w-7 back-pattern border-2 opacity-70" />
        </span>
      )}
      <span
        aria-hidden="true"
        className={`absolute -top-1.5 -right-1.5 pixel-box px-0.5 font-pixel text-xs leading-tight ${
          own ? 'bg-gold text-surface' : 'bg-raised text-muted'
        }`}
      >
        {canto.points}
      </span>
    </span>
  )
}
