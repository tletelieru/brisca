import { trickPoints } from '@brisca/engine'
import { sameCard } from '@brisca/engine'
import type { Canto, Suit, Trick } from '@brisca/engine'
import { useMessages } from '../i18n/messages'
import { cardKey } from '../lib/cards'
import { CantoMark } from './CantoMark'
import { SpanishCard } from './SpanishCard'

interface Props {
  tricks: Trick[]
  allTricks: Trick[]
  trump: Suit
  cantos: Canto[]
}

export function TricksPanel({ tricks, allTricks, trump, cantos }: Props) {
  const t = useMessages()

  if (tricks.length === 0) return <p className="text-sm text-muted">{t.noTricks}</p>

  const total = tricks.reduce((sum, trick) => sum + trickPoints(trick), 0)

  return (
    <>
      <ol className="flex flex-col gap-1.5">
        {tricks.map((trick) => (
          <li key={cardKey(trick.plays[0].card)} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center font-pixel text-lg leading-none text-gold">
              {allTricks.indexOf(trick) + 1}
            </span>
            <div className="flex gap-0.5">
              {trick.plays.map(({ seat, card }) => {
                const canto = cantos.find(
                  (item) => item.trick === allTricks.indexOf(trick) && sameCard(item.card, card),
                )
                if (canto) return <CantoMark key={cardKey(card)} canto={canto} owner={trick.winner} trump={trump} />
                return (
                  <SpanishCard
                    key={cardKey(card)}
                    card={card}
                    size="sm"
                    highlight={seat === trick.winner}
                    marked={card.suit === trump}
                  />
                )
              })}
            </div>
            <span className="ml-auto text-sm leading-tight tabular-nums">{t.pointsShort(trickPoints(trick))}</span>
          </li>
        ))}
      </ol>
      <p className="flex justify-between pixel-box bg-raised px-3 py-1.5 text-sm">
        <span>{t.tricksTotal(tricks.length)}</span>
        <span className="font-pixel text-xl leading-none tabular-nums text-gold">
          {t.pointsShort(total)}
        </span>
      </p>
    </>
  )
}
