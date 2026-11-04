export const SUITS = ['oros', 'copas', 'espadas', 'bastos'] as const

export type Suit = (typeof SUITS)[number]

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const

export type Rank = (typeof RANKS)[number]

export type PlayerCount = 3 | 4

export type Seat = number

export interface Card {
  suit: Suit
  rank: Rank
}

export const DECK_SIZE = 40

export const REMOVED_WITH_THREE: Card = { suit: 'bastos', rank: 2 }

export const STRENGTH_ORDER: Rank[] = [1, 3, 12, 11, 10, 7, 6, 5, 4, 2]

export const CARD_POINTS: Record<Rank, number> = {
  1: 10,
  2: 0,
  3: 10,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  10: 0,
  11: 0,
  12: 0,
}

export const MONO_POINTS: Record<Rank, number> = {
  1: 1,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  10: 2,
  11: 3,
  12: 4,
}

export const LAST_TRICK_POINTS = 10

export const CANTO_POINTS = 20

export const TRUMP_CANTO_POINTS = 40

export function cardId(card: Card): string {
  return `${card.rank}-${card.suit}`
}

export function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank
}

export function createDeck(players: PlayerCount = 4): Card[] {
  const deck = SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })))
  if (players !== 3) return deck
  return deck.filter((card) => !sameCard(card, REMOVED_WITH_THREE))
}

export function cardPoints(card: Card): number {
  return CARD_POINTS[card.rank]
}

export function cardMonos(card: Card): number {
  return MONO_POINTS[card.rank]
}

export function cantoPoints(suit: Suit, trump: Suit): number {
  return suit === trump ? TRUMP_CANTO_POINTS : CANTO_POINTS
}

export function canGolpe(hand: Card[], card: Card): boolean {
  if (card.rank !== 11 && card.rank !== 12) return false
  const partner = card.rank === 11 ? 12 : 11
  return hand.some((held) => held.suit === card.suit && held.rank === partner)
}

export function cardStrength(card: Card): number {
  return STRENGTH_ORDER.length - STRENGTH_ORDER.indexOf(card.rank)
}

export function beats(challenger: Card, best: Card, trump: Suit): boolean {
  if (challenger.suit === best.suit) return cardStrength(challenger) > cardStrength(best)
  return challenger.suit === trump
}
