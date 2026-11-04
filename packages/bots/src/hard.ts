import { beats, cardPoints, cardStrength } from '@brisca/engine'
import type { Card, Suit } from '@brisca/engine'
import { botFrom, discardCost, pickBy, tableState } from './easy'
import type { CardPolicy } from './easy'
import { unseenCards } from './knowledge'
import type { Bot } from './types'

const WORTH_TRUMPING = 10
const WORTH_WINNING = 4

function isMaster(card: Card, trump: Suit, hidden: Card[][]): boolean {
  const strength = cardStrength(card)
  let trumpsOut = false
  for (const hand of hidden) {
    for (const item of hand) {
      if (item.suit === card.suit && cardStrength(item) > strength) return false
      if (item.suit === trump) trumpsOut = true
    }
  }
  return card.suit === trump || !trumpsOut
}

export const countingPolicy: CardPolicy = (cards, spot, rng) => {
  const { trump, hidden } = spot
  const { best, onTable, last } = tableState(spot)
  const cheapest = (card: Card) => -discardCost(card, trump)
  if (!best) {
    return pickBy(cards, (card) => {
      if (card.suit !== trump && cardPoints(card) > 0 && isMaster(card, trump, hidden)) {
        return 30 + cardPoints(card)
      }
      return cheapest(card)
    }, rng)
  }
  const winners = cards.filter((card) => beats(card, best, trump))
  const holds = winners.filter((card) => last || isMaster(card, trump, hidden))
  const plain = holds.filter((card) => card.suit !== trump || best.suit === trump)
  if (plain.length > 0) {
    return pickBy(plain, (card) => cardPoints(card) * 2 - cardStrength(card) / 10, rng)
  }
  const trumps = winners.filter((card) => card.suit === trump && best.suit !== trump)
  if (trumps.length > 0 && onTable >= WORTH_TRUMPING) return pickBy(trumps, cheapest, rng)
  const risky = winners.filter((card) => card.suit !== trump && cardPoints(card) === 0)
  if (risky.length > 0 && onTable >= WORTH_WINNING) return pickBy(risky, cheapest, rng)
  return pickBy(cards, cheapest, rng)
}

export const countingBot: Bot = botFrom(countingPolicy, (view) => [unseenCards(view)])
