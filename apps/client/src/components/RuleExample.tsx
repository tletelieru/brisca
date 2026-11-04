import { CANTO_POINTS, CARD_POINTS, MONO_POINTS, STRENGTH_ORDER, SUITS, TRUMP_CANTO_POINTS } from '@brisca/engine'
import type { Card, Rank } from '@brisca/engine'
import type { ReactNode } from 'react'
import { useMessages } from '../i18n/messages'
import type { Messages } from '../i18n/messages'
import type { RuleExampleId } from '../i18n/rules'
import { cardKey } from '../lib/cards'
import { SpanishCard } from './SpanishCard'

interface Shown {
  card: Card
  caption?: string
  highlight?: boolean
  marked?: boolean
  crossed?: boolean
}

function CardRow({ cards }: { cards: Shown[] }) {
  return (
    <div className="flex flex-wrap items-end gap-1">
      {cards.map(({ card, caption, highlight = false, marked = false, crossed = false }) => (
        <figure key={cardKey(card)} className="relative flex flex-col items-center gap-0.5">
          <SpanishCard card={card} size="sm" highlight={highlight} marked={marked} />
          {crossed && (
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 flex h-11 items-center justify-center font-pixel text-3xl leading-none text-rose-600"
            >
              ✕
            </span>
          )}
          {caption && <figcaption className="text-xs leading-none text-muted">{caption}</figcaption>}
        </figure>
      ))}
    </div>
  )
}

function Back() {
  return <span aria-hidden="true" className="block h-11 w-7 back-pattern" />
}

function Packet({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-1">
      <span aria-hidden="true" className="relative block h-11 w-9">
        <span className="absolute top-0 left-0">
          <Back />
        </span>
        <span className="absolute top-0 left-1">
          <Back />
        </span>
      </span>
      <span className="font-pixel text-xl leading-none">{count}</span>
    </span>
  )
}

const PACKETS: { players: number; packets: number[] }[] = [
  { players: 3, packets: [6, 7] },
  { players: 4, packets: [5, 5] },
]

const SEATS = [
  { place: 'col-start-2 row-start-3', order: 1 },
  { place: 'col-start-3 row-start-2', order: 2 },
  { place: 'col-start-2 row-start-1', order: 3 },
  { place: 'col-start-1 row-start-2', order: 4 },
]

function Seating({ t, numbered }: { t: Messages; numbered: boolean }) {
  return (
    <div className="grid w-56 grid-cols-3 grid-rows-3 items-center justify-items-center gap-1">
      {SEATS.map(({ place, order }, seat) => {
        const name = seat === 0 ? t.you : t.bot(seat)
        return (
          <span
            key={seat}
            className={`${place} flex min-w-16 flex-col items-center pixel-box px-1.5 py-0.5 text-xs leading-tight ${
              seat === 0 ? 'bg-accent text-on-accent' : 'bg-raised'
            }`}
          >
            {numbered && <span className="font-pixel text-base leading-none">{order}</span>}
            {name}
          </span>
        )
      })}
      <span aria-hidden="true" className="col-start-2 row-start-2 font-pixel text-3xl leading-none text-gold">
        ↺
      </span>
    </div>
  )
}

const card = (suit: Card['suit'], rank: Rank): Card => ({ suit, rank })

const POINT_RANKS: Rank[] = [1, 3]

const MONO_RANKS: Rank[] = [1, 12, 11, 10]

function render(id: RuleExampleId, t: Messages): ReactNode {
  switch (id) {
    case 'deck':
      return <CardRow cards={SUITS.map((suit) => ({ card: card(suit, 1), caption: `× 10` }))} />
    case 'seating':
      return <Seating t={t} numbered={false} />
    case 'turns':
      return <Seating t={t} numbered />
    case 'removed':
      return <CardRow cards={[{ card: card('bastos', 2), crossed: true, caption: t.ruleRemoved }]} />
    case 'deal':
      return (
        <div className="flex flex-col gap-1.5">
          {PACKETS.map(({ players, packets }) => (
            <div key={players} className="flex items-center gap-2 text-xs text-muted">
              <span className="w-24">{t.playerCount(players)}</span>
              {packets.map((count, index) => (
                <Packet key={index} count={count} />
              ))}
            </div>
          ))}
        </div>
      )
    case 'trumpCard':
      return (
        <div className="flex items-end gap-2">
          <Back />
          <Back />
          <CardRow cards={[{ card: card('bastos', 5), marked: true, highlight: true, caption: t.trump }]} />
          <span className="text-xs text-muted">{t.ruleDealerKeeps}</span>
        </div>
      )
    case 'follow':
      return (
        <CardRow
          cards={[
            { card: card('copas', 5), caption: t.ruleLead },
            { card: card('copas', 7), caption: t.ruleAnswer, highlight: true },
            { card: card('espadas', 1), caption: t.ruleNotAllowed, crossed: true },
          ]}
        />
      )
    case 'mustBeat':
      return (
        <CardRow
          cards={[
            { card: card('oros', 11), caption: t.ruleLead },
            { card: card('oros', 3), caption: t.ruleAnswer, highlight: true },
            { card: card('oros', 4), caption: t.ruleNotAllowed, crossed: true },
          ]}
        />
      )
    case 'mustTrump':
      return (
        <CardRow
          cards={[
            { card: card('copas', 1), caption: t.ruleLead },
            { card: card('bastos', 4), caption: t.ruleAnswer, marked: true, highlight: true },
            { card: card('espadas', 7), caption: t.ruleNotAllowed, crossed: true },
          ]}
        />
      )
    case 'overtrump':
      return (
        <CardRow
          cards={[
            { card: card('copas', 5), caption: t.ruleLead },
            { card: card('bastos', 6), caption: t.ruleBest, marked: true },
            { card: card('bastos', 7), caption: t.ruleAnswer, marked: true, highlight: true },
            { card: card('bastos', 4), caption: t.ruleNotAllowed, marked: true, crossed: true },
          ]}
        />
      )
    case 'trumpBeats':
      return (
        <CardRow
          cards={[
            { card: card('copas', 1), caption: t.ruleLead },
            { card: card('bastos', 2), caption: t.trump, marked: true, highlight: true },
          ]}
        />
      )
    case 'order':
      return <CardRow cards={STRENGTH_ORDER.map((rank) => ({ card: card('oros', rank) }))} />
    case 'points':
      return (
        <CardRow
          cards={POINT_RANKS.map((rank, index) => ({
            card: card(SUITS[index % SUITS.length], rank),
            caption: String(CARD_POINTS[rank]),
          }))}
        />
      )
    case 'canto':
      return (
        <CardRow
          cards={[
            { card: card('espadas', 12) },
            { card: card('espadas', 11), caption: String(CANTO_POINTS), highlight: true },
            { card: card('bastos', 12), marked: true },
            { card: card('bastos', 11), caption: String(TRUMP_CANTO_POINTS), marked: true, highlight: true },
          ]}
        />
      )
    case 'monos':
      return (
        <CardRow
          cards={MONO_RANKS.map((rank, index) => ({
            card: card(SUITS[index % SUITS.length], rank),
            caption: String(MONO_POINTS[rank]),
          }))}
        />
      )
  }
}

export function RuleExample({ id }: { id: RuleExampleId }) {
  const t = useMessages()
  return <div className="pt-1.5">{render(id, t)}</div>
}
