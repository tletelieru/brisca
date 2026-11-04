import { beats, canGolpe, cantoPoints, createDeck, sameCard } from './cards'
import type { Card, PlayerCount, Seat, Suit } from './cards'
import { nextRandom, shuffle } from './rng'
import { tally } from './scoring'
import type { Canto, Score } from './scoring'

export interface MatchConfig {
  players: PlayerCount
}

export interface Play {
  seat: Seat
  card: Card
}

export interface Trick {
  plays: Play[]
  winner: Seat
}

export type MatchStatus = 'playing' | 'matchOver'

export interface MatchState {
  players: PlayerCount
  rng: number
  dealer: Seat
  trump: Card
  hands: Card[][]
  turn: Seat
  current: Play[]
  tricks: Trick[]
  cantos: Canto[]
  status: MatchStatus
}

export interface Action {
  type: 'play'
  seat: Seat
  card: Card
  golpe?: boolean
}

export type PlayRule = 'free' | 'follow' | 'beat' | 'trump' | 'overtrump'

export interface Requirement {
  rule: PlayRule
  cards: Card[]
}

export function nextSeat(seat: Seat, players: PlayerCount): Seat {
  return (seat + 1) % players
}

export function tricksPerMatch(players: PlayerCount): number {
  return createDeck(players).length / players
}

export function handSize(players: PlayerCount): number {
  return tricksPerMatch(players)
}

export const DEAL_PACKETS: Record<PlayerCount, number[]> = {
  3: [6, 7],
  4: [5, 5],
}

export function dealOrder(dealer: Seat, players: PlayerCount): Seat[] {
  const leader = nextSeat(dealer, players)
  return DEAL_PACKETS[players].flatMap((packet) =>
    Array.from({ length: players }, (_, offset) => (leader + offset) % players).flatMap((seat) =>
      Array<Seat>(packet).fill(seat),
    ),
  )
}

export function createMatch(config: MatchConfig, seed: number): MatchState {
  const { players } = config
  const random = nextRandom(seed)
  const dealer = Math.floor(random.value * players)
  const { items: deck, rng } = shuffle(createDeck(players), random.rng)
  const leader = nextSeat(dealer, players)
  const hands: Card[][] = Array.from({ length: players }, () => [])
  dealOrder(dealer, players).forEach((seat, index) => {
    hands[seat].push(deck[index])
  })
  return {
    players,
    rng,
    dealer,
    trump: deck[deck.length - 1],
    hands,
    turn: leader,
    current: [],
    tricks: [],
    cantos: [],
    status: 'playing',
  }
}

export function trickWinner(plays: Play[], trump: Suit): Seat {
  return plays.reduce((best, play) => (beats(play.card, best.card, trump) ? play : best)).seat
}

function winningCard(plays: Play[], trump: Suit): Card {
  return plays.reduce((best, play) => (beats(play.card, best.card, trump) ? play : best)).card
}

export function playRequirement(hand: Card[], current: Play[], trump: Suit): Requirement {
  if (current.length === 0) return { rule: 'free', cards: hand }
  const lead = current[0].card.suit
  const best = winningCard(current, trump)
  const follow = hand.filter((card) => card.suit === lead)
  if (follow.length > 0) {
    if (best.suit !== lead) return { rule: 'follow', cards: follow }
    const higher = follow.filter((card) => beats(card, best, trump))
    if (higher.length > 0) return { rule: 'beat', cards: higher }
    return { rule: 'follow', cards: follow }
  }
  const trumps = hand.filter((card) => card.suit === trump)
  if (trumps.length === 0) return { rule: 'free', cards: hand }
  if (best.suit !== trump) return { rule: 'trump', cards: trumps }
  const over = trumps.filter((card) => beats(card, best, trump))
  if (over.length > 0) return { rule: 'overtrump', cards: over }
  return { rule: 'free', cards: hand }
}

export function legalActions(state: MatchState, seat: Seat): Action[] {
  if (state.status !== 'playing' || state.turn !== seat) return []
  const hand = state.hands[seat]
  const { cards } = playRequirement(hand, state.current, state.trump.suit)
  return cards.flatMap((card): Action[] => {
    const plain: Action = { type: 'play', seat, card }
    return canGolpe(hand, card) ? [plain, { ...plain, golpe: true }] : [plain]
  })
}

function isLegal(state: MatchState, action: Action): boolean {
  if (action?.type !== 'play' || !action.card) return false
  const golpe = action.golpe === true
  return legalActions(state, action.seat).some(
    (option) => sameCard(option.card, action.card) && (option.golpe === true) === golpe,
  )
}

export function applyAction(state: MatchState, action: Action): MatchState {
  if (!isLegal(state, action)) throw new Error('Illegal action')
  const { seat, card } = action
  const hands = state.hands.map((hand, index) =>
    index === seat ? hand.filter((held) => !sameCard(held, card)) : hand,
  )
  const current = [...state.current, { seat, card }]
  const cantos = action.golpe
    ? [
        ...state.cantos,
        { seat, suit: card.suit, points: cantoPoints(card.suit, state.trump.suit), trick: state.tricks.length, card },
      ]
    : state.cantos
  if (current.length < state.players) {
    return { ...state, hands, current, cantos, turn: nextSeat(seat, state.players) }
  }
  const winner = trickWinner(current, state.trump.suit)
  const tricks = [...state.tricks, { plays: current, winner }]
  const over = hands.every((hand) => hand.length === 0)
  return {
    ...state,
    hands,
    current: [],
    tricks,
    cantos,
    turn: winner,
    status: over ? 'matchOver' : 'playing',
  }
}

export function score(state: MatchState): Score {
  return tally(state.tricks, state.players, state.cantos, state.status === 'matchOver')
}
