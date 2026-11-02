export const SUITS = ['oros', 'copas', 'espadas', 'bastos'] as const

export type Suit = (typeof SUITS)[number]

export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const

export type Rank = (typeof RANKS)[number]

export interface Card {
  suit: Suit
  rank: Rank
}

export const DECK_SIZE = 40

export function cardId(card: Card): string {
  return `${card.rank}-${card.suit}`
}

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })))
}
