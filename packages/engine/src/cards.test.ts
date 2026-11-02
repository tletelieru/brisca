import { describe, expect, it } from 'vitest'
import { DECK_SIZE, cardId, createDeck } from './cards'
import { shuffle } from './rng'

describe('deck', () => {
  it('has ${DECK_SIZE} unique cards', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(DECK_SIZE)
    expect(new Set(deck.map(cardId)).size).toBe(DECK_SIZE)
  })

  it('has one card of each rank and suit', () => {
    const deck = createDeck()
    expect(deck.filter((card) => card.suit === 'oros')).toHaveLength(10)
    expect(deck.some((card) => (card.rank as number) === 8)).toBe(false)
  })

  it('shuffles the same way for the same seed', () => {
    const deck = createDeck()
    const first = shuffle(deck, 42).items.map(cardId)
    const second = shuffle(deck, 42).items.map(cardId)
    expect(first).toEqual(second)
    expect(new Set(first).size).toBe(DECK_SIZE)
  })
})
