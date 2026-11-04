import { cardStrength } from '@brisca/engine'
import type { Card, PlayerCount, Rank, Suit } from '@brisca/engine'

export type SeatPosition = 'bottom' | 'right' | 'top' | 'left'

const POSITIONS: Record<PlayerCount, SeatPosition[]> = {
  3: ['bottom', 'right', 'left'],
  4: ['bottom', 'right', 'top', 'left'],
}

export const SEAT_VECTOR: Record<SeatPosition, { x: number; y: number }> = {
  bottom: { x: 0, y: 260 },
  right: { x: 150, y: 0 },
  top: { x: 0, y: -200 },
  left: { x: -150, y: 0 },
}

export const SUIT_ON_CARD: Record<Suit, string> = {
  oros: 'text-suit-oros',
  copas: 'text-suit-copas',
  espadas: 'text-suit-espadas',
  bastos: 'text-suit-bastos',
}

export const SUIT_ON_TABLE: Record<Suit, string> = {
  oros: 'text-table-oros',
  copas: 'text-table-copas',
  espadas: 'text-table-espadas',
  bastos: 'text-table-bastos',
}

const HAND_SUITS: Suit[] = ['oros', 'copas', 'espadas', 'bastos']

export function cardKey(card: Card): string {
  return `${card.suit}-${card.rank}`
}

export function rankLabel(rank: Rank): string {
  return String(rank)
}

export function isFigure(rank: Rank): boolean {
  return rank >= 10
}

export function seatPosition(seat: number, players: PlayerCount): SeatPosition {
  return POSITIONS[players][seat]
}

export function sortHand(hand: Card[], trump: Suit): Card[] {
  const order = (suit: Suit) => (suit === trump ? HAND_SUITS.length : HAND_SUITS.indexOf(suit))
  return [...hand].sort(
    (a, b) => order(a.suit) - order(b.suit) || cardStrength(b) - cardStrength(a),
  )
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const result = [...items]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}
