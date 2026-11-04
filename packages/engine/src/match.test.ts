import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { LAST_TRICK_POINTS, REMOVED_WITH_THREE, createDeck, sameCard } from './cards'
import type { Card, PlayerCount, Seat } from './cards'
import {
  applyAction,
  createMatch,
  dealOrder,
  handSize,
  legalActions,
  playRequirement,
  score,
  trickWinner,
  tricksPerMatch,
} from './match'
import type { Action, MatchState } from './match'
import { nextRandom } from './rng'
import { viewFor } from './view'

const seeds = fc.integer({ min: 0, max: 2 ** 31 - 1 })
const playerCounts = fc.constantFrom<PlayerCount>(3, 4)

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank })

function step(state: MatchState, rng: number): { state: MatchState; rng: number } {
  const legal = legalActions(state, state.turn)
  const random = nextRandom(rng)
  const action = legal[Math.floor(random.value * legal.length)]
  return { state: applyAction(state, action), rng: random.rng }
}

function playMatch(players: PlayerCount, seed: number, visit?: (state: MatchState) => void) {
  let state = createMatch({ players }, seed)
  let rng = seed
  let moves = 0
  while (state.status === 'playing') {
    visit?.(state)
    ;({ state, rng } = step(state, rng))
    moves += 1
  }
  visit?.(state)
  return { state, moves }
}

function cardsInMatch(state: MatchState): Card[] {
  const played = [...state.tricks.flatMap((trick) => trick.plays), ...state.current]
  return [...state.hands.flat(), ...played.map((play) => play.card)]
}

function trickState(hands: Card[][], turn: Seat, trump: Card): MatchState {
  return {
    players: hands.length as PlayerCount,
    rng: 1,
    dealer: 0,
    trump,
    hands,
    turn,
    current: [],
    tricks: [],
    cantos: [],
    status: 'playing',
  }
}

describe('match properties', () => {
  it('never loses or duplicates a card', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const deck = createDeck(players)
        playMatch(players, seed, (current) => {
          const cards = cardsInMatch(current)
          expect(cards).toHaveLength(deck.length)
          expect(deck.every((item) => cards.some((held) => sameCard(held, item)))).toBe(true)
        })
      }),
      { numRuns: 500 },
    )
  })

  it('adds up aces, threes, the last trick and the cantos, and ends when every hand is empty', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const { state, moves } = playMatch(players, seed)
        expect(state.status).toBe('matchOver')
        expect(state.hands.every((hand) => hand.length === 0)).toBe(true)
        expect(state.tricks).toHaveLength(tricksPerMatch(players))
        expect(moves).toBe(createDeck(players).length)
        const result = score(state)
        const cantos = state.cantos.reduce((sum, canto) => sum + canto.points, 0)
        expect(result.points.reduce((sum, points) => sum + points, 0)).toBe(80 + LAST_TRICK_POINTS + cantos)
        expect(result.breakdown[state.tricks.at(-1)!.winner].last).toBe(LAST_TRICK_POINTS)
        expect(result.tricks.reduce((sum, won) => sum + won, 0)).toBe(tricksPerMatch(players))
      }),
      { numRuns: 5000 },
    )
  })

  it('only offers cards that follow the mandatory play rules', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        playMatch(players, seed, (state) => {
          if (state.status !== 'playing' || state.current.length === 0) return
          const hand = state.hands[state.turn]
          const legal = legalActions(state, state.turn).map((action) => action.card)
          const lead = state.current[0].card.suit
          expect(legal.length).toBeGreaterThan(0)
          if (hand.some((item) => item.suit === lead)) {
            expect(legal.every((item) => item.suit === lead)).toBe(true)
          }
        })
      }),
      { numRuns: 300 },
    )
  })

  it('replays identically from the same seed', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        expect(playMatch(players, seed).state).toEqual(playMatch(players, seed).state)
      }),
      { numRuns: 100 },
    )
  })

  it('stays serializable', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        playMatch(players, seed, (state) => {
          expect(JSON.parse(JSON.stringify(state))).toEqual(state)
        })
      }),
      { numRuns: 50 },
    )
  })

  it('rejects every action outside the legal list', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const deck = createDeck(players)
        playMatch(players, seed, (state) => {
          if (nextRandom(state.rng + cardsInMatch(state).length + state.tricks.length).value > 0.2) return
          for (let seat = 0; seat < players; seat++) {
            const legal = legalActions(state, seat)
            for (const item of deck) {
              const action: Action = { type: 'play', seat, card: item }
              const allowed = legal.some((option) => sameCard(option.card, item))
              if (allowed) expect(() => applyAction(state, action)).not.toThrow()
              else expect(() => applyAction(state, action)).toThrow('Illegal action')
            }
          }
        })
      }),
      { numRuns: 100 },
    )
  })

  it('rejects every action once the match is over', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        const { state } = playMatch(players, seed)
        for (let seat = 0; seat < players; seat++) {
          expect(legalActions(state, seat)).toEqual([])
          const action: Action = { type: 'play', seat, card: card('oros', 1) }
          expect(() => applyAction(state, action)).toThrow('Illegal action')
        }
      }),
      { numRuns: 100 },
    )
  })

  it('never shows another hand in a view', () => {
    fc.assert(
      fc.property(playerCounts, seeds, (players, seed) => {
        playMatch(players, seed, (state) => {
          const view = viewFor(state, 1)
          expect(view).not.toHaveProperty('rng')
          expect(view).not.toHaveProperty('hands')
          expect(view.hand).toEqual(state.hands[1])
        })
      }),
      { numRuns: 50 },
    )
  })
})

describe('dealing', () => {
  it.each([
    [3, 13],
    [4, 10],
  ] as const)('deals the whole deck to %i players, %i cards each', (players, size) => {
    const state = createMatch({ players }, 7)
    expect(handSize(players)).toBe(size)
    expect(state.hands.map((hand) => hand.length)).toEqual(Array(players).fill(size))
    expect(state.turn).toBe((state.dealer + 1) % players)
  })

  it.each([
    [3, [6, 7]],
    [4, [5, 5]],
  ] as const)('deals %i players in packets of %j starting after the dealer', (players, packets) => {
    const dealer = players - 1
    const order = dealOrder(dealer, players)
    const expected = packets.flatMap((packet) =>
      Array.from({ length: players }, (_, seat) => Array<number>(packet).fill(seat)).flat(),
    )
    expect(order).toEqual(expected)
    expect(order.at(-1)).toBe(dealer)
  })

  it('turns up the last card dealt, which stays in the dealer hand as trump', () => {
    for (let seed = 0; seed < 40; seed++) {
      const players: PlayerCount = seed % 2 === 0 ? 3 : 4
      const state = createMatch({ players }, seed)
      expect(state.hands[state.dealer].at(-1)).toEqual(state.trump)
      expect(state.hands.flat().filter((item) => sameCard(item, state.trump))).toHaveLength(1)
    }
  })

  it('removes the 2 of bastos with 3 players only', () => {
    expect(REMOVED_WITH_THREE).toEqual(card('bastos', 2))
    expect(createDeck(3)).toHaveLength(39)
    expect(createDeck(3).some((item) => sameCard(item, REMOVED_WITH_THREE))).toBe(false)
    expect(createDeck(4)).toHaveLength(40)
  })
})

describe('mandatory play', () => {
  const trump = 'bastos'
  const rules = (hand: Card[], plays: [Seat, Card][]) =>
    playRequirement(hand, plays.map(([seat, item]) => ({ seat, card: item })), trump)

  it('lets the leader play any card', () => {
    const hand = [card('oros', 4), card('bastos', 1), card('copas', 7)]
    expect(rules(hand, [])).toEqual({ rule: 'free', cards: hand })
  })

  it('makes you beat the winning card of the suit led when you can', () => {
    const hand = [card('oros', 4), card('oros', 3), card('oros', 12), card('bastos', 1)]
    expect(rules(hand, [[0, card('oros', 11)]])).toEqual({
      rule: 'beat',
      cards: [card('oros', 3), card('oros', 12)],
    })
  })

  it('makes you follow suit with any card when you cannot beat it', () => {
    const hand = [card('oros', 4), card('oros', 5), card('bastos', 1)]
    expect(rules(hand, [[0, card('oros', 1)]])).toEqual({
      rule: 'follow',
      cards: [card('oros', 4), card('oros', 5)],
    })
  })

  it('lets you follow suit with any card once someone has trumped', () => {
    const hand = [card('oros', 4), card('oros', 1), card('bastos', 1)]
    expect(rules(hand, [[0, card('oros', 5)], [1, card('bastos', 4)]])).toEqual({
      rule: 'follow',
      cards: [card('oros', 4), card('oros', 1)],
    })
  })

  it('makes you beat a trump lead with a higher trump', () => {
    const hand = [card('bastos', 4), card('bastos', 3), card('oros', 1)]
    expect(rules(hand, [[0, card('bastos', 12)]])).toEqual({ rule: 'beat', cards: [card('bastos', 3)] })
  })

  it('makes you trump when you cannot follow suit', () => {
    const hand = [card('copas', 1), card('bastos', 4), card('bastos', 7)]
    expect(rules(hand, [[0, card('oros', 5)]])).toEqual({
      rule: 'trump',
      cards: [card('bastos', 4), card('bastos', 7)],
    })
  })

  it('makes you overtrump when a trump is already winning', () => {
    const hand = [card('copas', 1), card('bastos', 4), card('bastos', 7)]
    expect(rules(hand, [[0, card('oros', 5)], [1, card('bastos', 6)]])).toEqual({
      rule: 'overtrump',
      cards: [card('bastos', 7)],
    })
  })

  it('frees you when you cannot overtrump', () => {
    const hand = [card('copas', 1), card('bastos', 4)]
    expect(rules(hand, [[0, card('oros', 5)], [1, card('bastos', 6)]])).toEqual({ rule: 'free', cards: hand })
  })

  it('frees you when you have neither the suit led nor trumps', () => {
    const hand = [card('copas', 1), card('espadas', 4)]
    expect(rules(hand, [[0, card('oros', 5)]])).toEqual({ rule: 'free', cards: hand })
  })

  it('enforces the rules through legalActions and applyAction', () => {
    const hands = [[card('oros', 4)], [card('oros', 12), card('oros', 1), card('bastos', 2)], [card('copas', 2)]]
    const state = applyAction(trickState(hands, 0, card('bastos', 3)), {
      type: 'play',
      seat: 0,
      card: card('oros', 4),
    })
    expect(legalActions(state, 1).map((action) => action.card)).toEqual([card('oros', 12), card('oros', 1)])
    expect(() => applyAction(state, { type: 'play', seat: 1, card: card('bastos', 2) })).toThrow('Illegal action')
  })
})

describe('tricks', () => {
  it('ranks the Ace and the 3 above the King', () => {
    const trump = card('bastos', 2)
    expect(trickWinner([{ seat: 0, card: card('oros', 12) }, { seat: 1, card: card('oros', 3) }], 'bastos')).toBe(1)
    expect(trickWinner([{ seat: 0, card: card('oros', 3) }, { seat: 1, card: card('oros', 1) }], trump.suit)).toBe(1)
    expect(trickWinner([{ seat: 0, card: card('oros', 7) }, { seat: 1, card: card('oros', 10) }], trump.suit)).toBe(1)
  })

  it('lets any trump beat the suit led and ignores other suits', () => {
    const plays = [
      { seat: 0, card: card('oros', 1) },
      { seat: 1, card: card('copas', 1) },
      { seat: 2, card: card('bastos', 2) },
      { seat: 3, card: card('oros', 3) },
    ]
    expect(trickWinner(plays, 'bastos')).toBe(2)
    expect(trickWinner(plays, 'espadas')).toBe(0)
  })

  it('moves the turn to the next seat and the lead to the winner', () => {
    const hands = [[card('oros', 4), card('oros', 5)], [card('oros', 1), card('oros', 6)], [card('copas', 2), card('copas', 4)]]
    let state = trickState(hands, 0, card('espadas', 2))
    state = applyAction(state, { type: 'play', seat: 0, card: card('oros', 4) })
    expect(state.turn).toBe(1)
    state = applyAction(state, { type: 'play', seat: 1, card: card('oros', 1) })
    state = applyAction(state, { type: 'play', seat: 2, card: card('copas', 2) })
    expect(state.turn).toBe(1)
    expect(state.tricks[0].winner).toBe(1)
  })
})

describe('golpe', () => {
  const trump = card('bastos', 4)

  it('offers a golpe only with the king and knight of the same suit in hand', () => {
    const hands = [[card('oros', 12), card('oros', 11), card('copas', 12)], [card('oros', 5)], [card('oros', 6)]]
    const legal = legalActions(trickState(hands, 0, trump), 0)
    expect(legal.filter((action) => action.golpe).map((action) => action.card)).toEqual([
      card('oros', 12),
      card('oros', 11),
    ])
    expect(() =>
      applyAction(trickState(hands, 0, trump), { type: 'play', seat: 0, card: card('copas', 12), golpe: true }),
    ).toThrow('Illegal action')
  })

  it('scores 20 for the declarer even when someone else takes the trick', () => {
    const hands = [[card('oros', 12), card('oros', 11)], [card('oros', 1), card('oros', 5)], [card('oros', 6), card('oros', 7)]]
    let state = trickState(hands, 0, trump)
    state = applyAction(state, { type: 'play', seat: 0, card: card('oros', 12), golpe: true })
    state = applyAction(state, { type: 'play', seat: 1, card: card('oros', 1) })
    state = applyAction(state, { type: 'play', seat: 2, card: card('oros', 6) })
    expect(state.tricks[0].winner).toBe(1)
    expect(state.cantos).toEqual([{ seat: 0, suit: 'oros', points: 20, trick: 0, card: card('oros', 12) }])
    const result = score(state)
    expect(result.breakdown[0].cantos).toBe(20)
    expect(result.points).toEqual([20, 10, 0])
    expect(result.monos).toEqual([0, 5, 0])
  })

  it('scores 40 for the trump suit', () => {
    const hands = [[card('bastos', 11), card('bastos', 12)], [card('oros', 5), card('oros', 4)], [card('oros', 6), card('oros', 7)]]
    const state = applyAction(trickState(hands, 0, trump), { type: 'play', seat: 0, card: card('bastos', 11), golpe: true })
    expect(state.cantos[0].points).toBe(40)
  })

  it('loses the canto for good when the first card is played without knocking', () => {
    const hands = [[card('oros', 12), card('oros', 11)], [card('oros', 5), card('oros', 4)], [card('oros', 6), card('oros', 7)]]
    let state = trickState(hands, 0, trump)
    state = applyAction(state, { type: 'play', seat: 0, card: card('oros', 12) })
    state = applyAction(state, { type: 'play', seat: 1, card: card('oros', 5) })
    state = applyAction(state, { type: 'play', seat: 2, card: card('oros', 6) })
    expect(state.turn).toBe(0)
    expect(legalActions(state, 0).some((action) => action.golpe)).toBe(false)
    expect(state.cantos).toEqual([])
  })
})

describe('score', () => {
  it('scores every player on their own with 4 players', () => {
    const state: MatchState = {
      ...createMatch({ players: 4 }, 3),
      tricks: [
        {
          plays: [
            { seat: 0, card: card('oros', 1) },
            { seat: 1, card: card('oros', 3) },
            { seat: 2, card: card('oros', 12) },
            { seat: 3, card: card('oros', 2) },
          ],
          winner: 2,
        },
      ],
    }
    expect(score(state)).toMatchObject({ points: [0, 0, 20, 0], tricks: [0, 0, 1, 0], monos: [0, 0, 5, 0], winners: [2] })
  })

  it('gives 10 points for the last trick once the match is over', () => {
    const tricks = [{ plays: [{ seat: 1, card: card('oros', 4) }], winner: 1 }]
    const base = createMatch({ players: 3 }, 1)
    expect(score({ ...base, tricks }).points).toEqual([0, 0, 0])
    expect(score({ ...base, tricks, status: 'matchOver' }).points).toEqual([0, 10, 0])
  })

  it('breaks a tie on points with the monos', () => {
    const tricks = [
      { plays: [{ seat: 0, card: card('oros', 1) }, { seat: 1, card: card('copas', 4) }], winner: 0 },
      { plays: [{ seat: 1, card: card('copas', 1) }, { seat: 0, card: card('oros', 12) }], winner: 1 },
    ]
    const result = score({ ...createMatch({ players: 3 }, 1), tricks })
    expect(result.points).toEqual([10, 10, 0])
    expect(result.monos).toEqual([1, 5, 0])
    expect(result.tiebreak).toBe(true)
    expect(result.winners).toEqual([1])
  })

  it('keeps a tie when the monos are level too', () => {
    const tricks = [
      { plays: [{ seat: 0, card: card('oros', 1) }], winner: 0 },
      { plays: [{ seat: 1, card: card('copas', 1) }], winner: 1 },
    ]
    const result = score({ ...createMatch({ players: 3 }, 1), tricks })
    expect(result.tiebreak).toBe(true)
    expect(result.winners).toEqual([0, 1])
  })
})

describe('dealer', () => {
  it.each([3, 4] as const)('is drawn from the seed and lands on every seat with %i players', (players) => {
    const dealers = new Set(Array.from({ length: 60 }, (_, seed) => createMatch({ players }, seed).dealer))
    expect(dealers.size).toBe(players)
    expect(createMatch({ players }, 5).dealer).toBe(createMatch({ players }, 5).dealer)
  })
})
