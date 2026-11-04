import { applyAction, cardId, createDeck, createMatch, legalActions, sameCard, score, viewFor } from '@brisca/engine'
import type { Action, Card, MatchState, PlayerCount, PlayerView } from '@brisca/engine'
import { describe, expect, it } from 'vitest'
import {
  BOTS,
  countingBot,
  createRng,
  easyBot,
  inferCaps,
  sampleWorld,
  solveEndgame,
  trumpHolder,
  unseenCards,
} from './index'
import type { Bot } from './index'

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank })

function view(overrides: Partial<PlayerView>): PlayerView {
  return {
    seat: 1,
    players: 3,
    dealer: 0,
    turn: 1,
    hand: [],
    handCounts: [13, 13, 13],
    trump: card('bastos', 4),
    current: [],
    tricks: [],
    cantos: [],
    status: 'playing',
    ...overrides,
  }
}

function pickFrom(bot: Bot, state: PlayerView, legal: Action[], seed = 1): Action {
  return bot.choose(state, legal, createRng(seed))
}

function pick(bot: Bot, state: PlayerView, seed = 1): Card {
  const legal = state.hand.map((item) => ({ type: 'play' as const, seat: state.seat, card: item }))
  return pickFrom(bot, state, legal, seed).card
}

function playOut(players: PlayerCount, seed: number, bot: Bot): MatchState {
  const rng = createRng(seed)
  let state = createMatch({ players }, seed)
  while (state.status === 'playing') {
    const seat = state.turn
    const legal = legalActions(state, seat)
    const action = bot.choose(viewFor(state, seat), legal, rng)
    expect(legal.some((option) => sameCard(option.card, action.card) && !!option.golpe === !!action.golpe)).toBe(true)
    state = applyAction(state, action)
  }
  return state
}

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const first = createRng(7)
    const second = createRng(7)
    const a = [first(), first(), first()]
    const b = [second(), second(), second()]
    expect(a).toEqual(b)
    expect(a.every((value) => value >= 0 && value < 1)).toBe(true)
  })
})

describe('every level', () => {
  it.each([
    ['easy', 3],
    ['easy', 4],
    ['medium', 3],
    ['medium', 4],
    ['hard', 3],
    ['hard', 4],
  ] as const)('%s finishes a match with %i players using legal moves only', (level, players) => {
    const state = playOut(players, 11, BOTS[level])
    const result = score(state)
    const cantos = state.cantos.reduce((sum, canto) => sum + canto.points, 0)
    expect(result.points.reduce((sum, points) => sum + points, 0)).toBe(90 + cantos)
  })

  it('plays only legal moves with the counting rollout policy', () => {
    playOut(4, 5, countingBot)
  })

  it.each(['easy', 'medium', 'hard'] as const)('%s always knocks when it can sing', (level) => {
    const state = view({
      hand: [card('oros', 12), card('oros', 11), card('copas', 4)],
      handCounts: [13, 3, 13],
    })
    const legal: Action[] = [
      { type: 'play', seat: 1, card: card('oros', 12) },
      { type: 'play', seat: 1, card: card('oros', 12), golpe: true },
    ]
    expect(pickFrom(BOTS[level], state, legal).golpe).toBe(true)
  })
})

describe('easyBot', () => {
  it('keeps points off a trick it cannot win', () => {
    const state = view({
      hand: [card('copas', 1), card('espadas', 2), card('oros', 3)],
      current: [{ seat: 0, card: card('bastos', 1) }],
    })
    expect(pick(easyBot, state)).toEqual(card('espadas', 2))
  })

  it('takes a loaded trick with a cheap trump', () => {
    const state = view({
      hand: [card('bastos', 5), card('bastos', 1)],
      current: [{ seat: 0, card: card('oros', 1) }],
    })
    expect(pick(easyBot, state)).toEqual(card('bastos', 5))
  })

  it('leads a card without points', () => {
    const state = view({ hand: [card('oros', 1), card('copas', 4), card('bastos', 2)] })
    expect(pick(easyBot, state)).toEqual(card('copas', 4))
  })
})

describe('knowledge', () => {
  it('knows the dealer holds the turned-up trump until it is played', () => {
    const start = createMatch({ players: 3 }, 9)
    expect(trumpHolder(viewFor(start, 1))).toBe(start.dealer)
    const played = viewFor({ ...start, current: [{ seat: start.dealer, card: start.trump }] }, 1)
    expect(trumpHolder(played)).toBeNull()
  })

  it('learns who is out of a suit or cannot beat the table', () => {
    const state = view({
      tricks: [
        {
          plays: [
            { seat: 0, card: card('oros', 11) },
            { seat: 1, card: card('oros', 4) },
            { seat: 2, card: card('copas', 5) },
          ],
          winner: 0,
        },
      ],
    })
    const caps = inferCaps(state)
    expect(caps[1].oros).toBeLessThan(10)
    expect(caps[2].oros).toBe(0)
    expect(caps[2].bastos).toBe(0)
  })

  it('samples worlds that match the view', () => {
    const start = createMatch({ players: 3 }, 9)
    const seen = viewFor(start, start.dealer === 1 ? 2 : 1)
    const world = sampleWorld(seen, createRng(4), { counting: true })
    expect(world.hands[seen.seat]).toEqual(seen.hand)
    expect(world.hands.map((hand) => hand.length)).toEqual(seen.handCounts)
    expect(world.hands[start.dealer].some((item) => sameCard(item, start.trump))).toBe(true)
    const all = world.hands.flat().map(cardId)
    expect(new Set(all).size).toBe(createDeck(3).length)
    expect(unseenCards(seen)).toHaveLength(createDeck(3).length - 13)
  })

  it('never deals a card to a player known to be out of its suit', () => {
    let state = createMatch({ players: 3 }, 12)
    const rng = createRng(3)
    while (state.tricks.length < 5) state = applyAction(state, easyBot.choose(viewFor(state, state.turn), legalActions(state, state.turn), rng))
    const seen = viewFor(state, 0)
    const caps = inferCaps(seen)
    for (let round = 0; round < 20; round++) {
      const world = sampleWorld(seen, createRng(round), { counting: true })
      world.hands.forEach((hand, seat) => {
        if (seat === 0) return
        hand.forEach((item) => expect(caps[seat][item.suit]).toBeGreaterThan(0))
      })
    }
  })
})

describe('search bots', () => {
  it('solves an open endgame exactly, last trick included', () => {
    const state: MatchState = {
      ...createMatch({ players: 3 }, 1),
      trump: card('bastos', 4),
      hands: [[card('oros', 1)], [card('bastos', 2)], [card('copas', 5)]],
      turn: 0,
      current: [],
      tricks: [],
      cantos: [],
    }
    expect(solveEndgame(state)).toEqual([0, 20, 0])
  })

  it('counts a canto in the endgame', () => {
    const state: MatchState = {
      ...createMatch({ players: 3 }, 1),
      trump: card('bastos', 4),
      hands: [
        [card('oros', 12), card('oros', 11)],
        [card('copas', 5), card('copas', 6)],
        [card('espadas', 5), card('espadas', 6)],
      ],
      turn: 0,
      current: [],
      tricks: [],
      cantos: [],
    }
    expect(solveEndgame(state)[0]).toBe(30)
  })
})
