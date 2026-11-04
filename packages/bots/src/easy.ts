import { beats, cardPoints, cardStrength, nextRandom, sameCard } from '@brisca/engine'
import type { Action, Card, Play, PlayerCount, PlayerView, Suit } from '@brisca/engine'
import type { Bot, Rng } from './types'

const NOISE = 0.01
const WORTH_TRUMPING = 10

export interface Spot {
  trump: Suit
  current: Play[]
  players: PlayerCount
  hidden: Card[][]
}

export type CardPolicy = (cards: Card[], spot: Spot, rng: Rng) => Card

export function createRng(seed: number): Rng {
  let state = seed
  return () => {
    const random = nextRandom(state)
    state = random.rng
    return random.value
  }
}

export const randomBot: Bot = {
  choose: (_view, legal, rng) => legal[Math.floor(rng() * legal.length)],
}

export function discardCost(card: Card, trump: Suit): number {
  const trumpCost = card.suit === trump ? 20 + cardStrength(card) : 0
  return cardPoints(card) * 2 + trumpCost + cardStrength(card) / 10
}

export function pickBy(cards: Card[], score: (card: Card) => number, rng: Rng): Card {
  let best = cards[0]
  let bestScore = -Infinity
  for (const card of cards) {
    const value = score(card) + rng() * NOISE
    if (value > bestScore) {
      best = card
      bestScore = value
    }
  }
  return best
}

export function tableState({ trump, current, players }: Spot) {
  let best: Card | null = null
  let onTable = 0
  for (const play of current) {
    onTable += cardPoints(play.card)
    if (!best || beats(play.card, best, trump)) best = play.card
  }
  const last = current.length === players - 1
  return { best, onTable, last }
}

export const easyPolicy: CardPolicy = (cards, spot, rng) => {
  const { trump } = spot
  const { best, onTable, last } = tableState(spot)
  const cheapest = (card: Card) => -discardCost(card, trump)
  if (!best) return pickBy(cards, cheapest, rng)
  const winners = cards.filter((card) => beats(card, best, trump))
  const sameSuit = winners.filter((card) => card.suit !== trump || best.suit === trump)
  if (sameSuit.length > 0 && (last || onTable > 0)) {
    return pickBy(sameSuit, (card) => cardPoints(card) * 2 - cardStrength(card) / 10, rng)
  }
  const trumps = winners.filter((card) => card.suit === trump && best.suit !== trump)
  if (trumps.length > 0 && onTable >= WORTH_TRUMPING) {
    return pickBy(trumps, cheapest, rng)
  }
  return pickBy(cards, cheapest, rng)
}

export function withGolpe(legal: Action[]): Action[] {
  return legal.filter(
    (action) => action.golpe || !legal.some((other) => other.golpe && sameCard(other.card, action.card)),
  )
}

export function spotFor(view: PlayerView, hidden: Card[][] = []): Spot {
  return { trump: view.trump.suit, current: view.current, players: view.players, hidden }
}

export function botFrom(policy: CardPolicy, hidden: (view: PlayerView) => Card[][] = () => []): Bot {
  return {
    choose(view: PlayerView, legal: Action[], rng: Rng): Action {
      const options = withGolpe(legal)
      if (options.length === 1) return options[0]
      const card = policy(options.map((action) => action.card), spotFor(view, hidden(view)), rng)
      return options.find((action) => sameCard(action.card, card)) ?? options[0]
    },
  }
}

export const easyBot: Bot = botFrom(easyPolicy)
