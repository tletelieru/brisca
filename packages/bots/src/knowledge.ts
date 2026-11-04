import { SUITS, beats, cardStrength, createDeck, trickWinner } from '@brisca/engine'
import type { Card, MatchState, Play, PlayerView, Seat, Suit } from '@brisca/engine'
import type { Rng } from './types'

const STRONGEST = 10
const ATTEMPTS = 6

export type Caps = Record<Suit, number>[]

export function cardKey(card: Card): number {
  return SUITS.indexOf(card.suit) * 16 + card.rank
}

export function playedCards(view: PlayerView): Card[] {
  return [...view.tricks.flatMap((trick) => trick.plays), ...view.current].map((play) => play.card)
}

export function contains(cards: Card[], card: Card): boolean {
  const key = cardKey(card)
  return cards.some((item) => cardKey(item) === key)
}

export function unseenCards(view: PlayerView): Card[] {
  const seen = new Set([...playedCards(view), ...view.hand].map(cardKey))
  return createDeck(view.players).filter((card) => !seen.has(cardKey(card)))
}

export function trumpHolder(view: PlayerView): Seat | null {
  return contains(playedCards(view), view.trump) ? null : view.dealer
}

function lower(caps: Caps, seat: Seat, suit: Suit, value: number) {
  caps[seat][suit] = Math.min(caps[seat][suit], value)
}

function winningCard(plays: Play[], trump: Suit): Card {
  const winner = trickWinner(plays, trump)
  return plays.find((play) => play.seat === winner)?.card ?? plays[0].card
}

function learnFrom(caps: Caps, plays: Play[], trump: Suit) {
  if (plays.length === 0) return
  const lead = plays[0].card.suit
  for (let index = 1; index < plays.length; index++) {
    const { seat, card } = plays[index]
    const best = winningCard(plays.slice(0, index), trump)
    if (card.suit === lead) {
      if (best.suit === lead && !beats(card, best, trump)) lower(caps, seat, lead, cardStrength(best))
      continue
    }
    lower(caps, seat, lead, 0)
    if (card.suit === trump) {
      if (best.suit === trump && !beats(card, best, trump)) lower(caps, seat, trump, cardStrength(best))
      continue
    }
    lower(caps, seat, trump, best.suit === trump ? cardStrength(best) : 0)
  }
}

export function inferCaps(view: PlayerView): Caps {
  const caps: Caps = Array.from({ length: view.players }, () => ({
    oros: STRONGEST,
    copas: STRONGEST,
    espadas: STRONGEST,
    bastos: STRONGEST,
  }))
  const trump = view.trump.suit
  for (const trick of view.tricks) learnFrom(caps, trick.plays, trump)
  learnFrom(caps, view.current, trump)
  return caps
}

export function sideUtility(seat: Seat, points: number[]): number {
  const rivals = points.filter((_, other) => other !== seat)
  const best = Math.max(...rivals)
  const mean = rivals.reduce((sum, value) => sum + value, 0) / rivals.length
  return points[seat] - (best + mean) / 2
}

function shuffled<T>(items: T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function pickSeat(open: Seat[], left: number[], rng: Rng): Seat {
  const total = open.reduce((sum, seat) => sum + left[seat], 0)
  let roll = rng() * total
  for (const seat of open) {
    roll -= left[seat]
    if (roll < 0) return seat
  }
  return open[open.length - 1]
}

function fits(card: Card, seat: Seat, caps: Caps | null): boolean {
  return !caps || cardStrength(card) <= caps[seat][card.suit]
}

function dealWithCaps(pool: Card[], need: number[], caps: Caps | null, rng: Rng): Card[][] | null {
  const left = [...need]
  const hands: Card[][] = need.map(() => [])
  const options = shuffled(pool, rng)
    .map((card) => ({
      card,
      seats: need.flatMap((count, seat) => (count > 0 && fits(card, seat, caps) ? [seat] : [])),
    }))
    .sort((a, b) => a.seats.length - b.seats.length)
  for (const { card, seats } of options) {
    const open = seats.filter((seat) => left[seat] > 0)
    if (open.length === 0) return null
    const seat = pickSeat(open, left, rng)
    hands[seat].push(card)
    left[seat] -= 1
  }
  return hands
}

export interface SampleOptions {
  counting: boolean
}

export function sampleWorld(view: PlayerView, rng: Rng, { counting }: SampleOptions): MatchState {
  const holder = trumpHolder(view)
  const known = holder !== null && holder !== view.seat
  const trumpKey = cardKey(view.trump)
  const need = view.handCounts.map((count, seat) => {
    if (seat === view.seat) return 0
    return known && seat === holder ? count - 1 : count
  })
  const unseen = unseenCards(view).filter((card) => !known || cardKey(card) !== trumpKey)
  const total = need.reduce((sum, count) => sum + count, 0)
  const pool = unseen.length > total ? shuffled(unseen, rng).slice(0, total) : unseen
  const caps = counting ? inferCaps(view) : null
  let dealt: Card[][] | null = null
  for (let attempt = 0; attempt < ATTEMPTS && !dealt; attempt++) dealt = dealWithCaps(pool, need, caps, rng)
  const cards = dealt ?? dealWithCaps(pool, need, null, rng) ?? need.map(() => [])
  const hands = cards.map((hand, seat) => {
    if (seat === view.seat) return view.hand
    return known && seat === holder ? [...hand, view.trump] : hand
  })
  return {
    players: view.players,
    rng: 1,
    dealer: view.dealer,
    trump: view.trump,
    hands,
    turn: view.turn,
    current: view.current,
    tricks: view.tricks,
    cantos: view.cantos,
    status: view.status,
  }
}
