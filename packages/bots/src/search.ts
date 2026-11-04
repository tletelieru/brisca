import {
  LAST_TRICK_POINTS,
  applyAction,
  canGolpe,
  cantoPoints,
  cardPoints,
  nextSeat,
  playRequirement,
  score,
  trickWinner,
} from '@brisca/engine'
import type { Action, Card, MatchState, Play, PlayerCount, PlayerView, Seat, Suit } from '@brisca/engine'
import { withGolpe } from './easy'
import type { CardPolicy } from './easy'
import { sampleWorld, sideUtility } from './knowledge'
import type { Bot, Rng } from './types'

const WIN_BONUS = 20

export interface SearchOptions {
  iterations: number
  counting: boolean
  exactCards: number
  budgetMs: number
  policy: CardPolicy
}

function outcome(seat: Seat, points: number[]): number {
  const margin = sideUtility(seat, points)
  return margin + Math.sign(margin) * WIN_BONUS
}

function rollout(start: MatchState, policy: CardPolicy, rng: Rng): number[] {
  const { players } = start
  const trump = start.trump.suit
  const hands = start.hands.map((hand) => [...hand])
  const points = score(start).points
  let current = [...start.current]
  let turn = start.turn
  let left = hands.reduce((sum, hand) => sum + hand.length, 0)
  while (left > 0) {
    const hand = hands[turn]
    const cards = playRequirement(hand, current, trump).cards
    const hidden = hands.filter((_, seat) => seat !== turn)
    const card = cards.length === 1 ? cards[0] : policy(cards, { trump, current, players, hidden }, rng)
    if (canGolpe(hand, card)) points[turn] += cantoPoints(card.suit, trump)
    hand.splice(hand.indexOf(card), 1)
    left -= 1
    current.push({ seat: turn, card })
    if (current.length < players) {
      turn = nextSeat(turn, players)
      continue
    }
    const winner = trickWinner(current, trump)
    points[winner] += current.reduce((sum, play) => sum + cardPoints(play.card), 0)
    if (left === 0) points[winner] += LAST_TRICK_POINTS
    current = []
    turn = winner
  }
  return points
}

interface Endgame {
  hands: Card[][]
  players: PlayerCount
  trump: Suit
  points: number[]
}

function search(game: Endgame, turn: Seat, current: Play[]): number[] {
  const { hands, players, trump, points } = game
  if (current.length === players) {
    const winner = trickWinner(current, trump)
    const over = hands[winner].length === 0
    const gained = current.reduce((sum, play) => sum + cardPoints(play.card), 0) + (over ? LAST_TRICK_POINTS : 0)
    points[winner] += gained
    const result = over ? [...points] : search(game, winner, [])
    points[winner] -= gained
    return result
  }
  const hand = hands[turn]
  const options = playRequirement(hand, current, trump).cards
  let best: number[] = []
  let bestValue = -Infinity
  for (const card of options) {
    const canto = canGolpe(hand, card) ? cantoPoints(card.suit, trump) : 0
    const index = hand.indexOf(card)
    hand.splice(index, 1)
    points[turn] += canto
    current.push({ seat: turn, card })
    const result = search(game, nextSeat(turn, players), current)
    current.pop()
    points[turn] -= canto
    hand.splice(index, 0, card)
    const value = sideUtility(turn, result)
    if (value > bestValue) {
      best = result
      bestValue = value
    }
  }
  return best
}

export function solveEndgame(state: MatchState): number[] {
  if (state.status !== 'playing') return score(state).points
  const game: Endgame = {
    hands: state.hands.map((hand) => [...hand]),
    players: state.players,
    trump: state.trump.suit,
    points: score(state).points,
  }
  return search(game, state.turn, [...state.current])
}

function cardsLeft(state: MatchState): number {
  return state.hands.reduce((sum, hand) => sum + hand.length, 0)
}

export function createSearchBot({ iterations, counting, exactCards, budgetMs, policy }: SearchOptions): Bot {
  return {
    choose(view: PlayerView, legal: Action[], rng: Rng): Action {
      const options = withGolpe(legal)
      if (options.length === 1) return options[0]
      const started = performance.now()
      const totals = options.map(() => 0)
      for (let round = 0; round < iterations; round++) {
        if (round > 0 && performance.now() - started > budgetMs) break
        const world = sampleWorld(view, rng, { counting })
        options.forEach((action, index) => {
          const next = applyAction(world, action)
          const exact = cardsLeft(next) <= exactCards
          const points = exact ? solveEndgame(next) : rollout(next, policy, rng)
          totals[index] += outcome(view.seat, points)
        })
      }
      return options[totals.indexOf(Math.max(...totals))]
    },
  }
}
