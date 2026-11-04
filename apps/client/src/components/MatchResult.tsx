import { cardPoints, cardStrength, sameCard } from '@brisca/engine'
import type { Canto, Card, MatchState, Score, Seat } from '@brisca/engine'
import { useMessages } from '../i18n/messages'
import { cardKey } from '../lib/cards'
import { breakdownLine } from '../lib/score'
import { CantoMark } from './CantoMark'
import { SpanishCard } from './SpanishCard'

interface Props {
  names: string[]
  state: MatchState
  result: Score
}

interface Pile {
  cards: Card[]
  marks: Canto[]
}

function pileOf(state: MatchState, seat: Seat): Pile {
  const marks: Canto[] = []
  const cards: Card[] = []
  state.tricks.forEach((trick, index) => {
    if (trick.winner !== seat) return
    for (const { card } of trick.plays) {
      const canto = state.cantos.find((item) => item.trick === index && sameCard(item.card, card))
      if (canto) marks.push(canto)
      else if (cardPoints(card) > 0) cards.push(card)
    }
  })
  cards.sort((a, b) => cardStrength(b) - cardStrength(a))
  return { cards, marks }
}

export function MatchResult({ names, state, result }: Props) {
  const t = useMessages()

  return (
    <ul className="flex flex-col gap-2">
      {names.map((name, seat) => {
        const { cards, marks } = pileOf(state, seat)
        const winner = result.winners.length === 1 && result.winners[0] === seat
        const shown = [...cards.map((card) => t.cardName(card)), ...marks.map((mark) => t.cantoOf(names[mark.seat], mark.points))]
        return (
          <li
            key={name}
            data-side={seat}
            className={`flex flex-col gap-1 pixel-box bg-raised p-2 ${
              winner ? 'shadow-[inset_0_0_0_2px_var(--gold)]' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-pixel text-xl leading-none">
                {name}
                {winner && <span className="text-gold"> ★</span>}
              </span>
              <span className="font-pixel text-2xl leading-none text-gold tabular-nums">
                {result.points[seat]}
              </span>
            </div>
            <p className="text-xs text-muted">
              {breakdownLine(t, result.breakdown[seat], result.tiebreak ? result.monos[seat] : null)}
            </p>
            <div aria-label={shown.join(', ')} className="flex flex-wrap gap-y-1 pt-1 pr-2">
              {cards.map((card) => (
                <span key={cardKey(card)} className="-mr-2 last:mr-0">
                  <SpanishCard card={card} size="sm" marked={card.suit === state.trump.suit} />
                </span>
              ))}
              {marks.map((mark) => (
                <span key={cardKey(mark.card)} className="ml-3">
                  <CantoMark canto={mark} owner={seat} trump={state.trump.suit} />
                </span>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
