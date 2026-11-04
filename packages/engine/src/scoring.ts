import { LAST_TRICK_POINTS, cardMonos, cardPoints } from './cards'
import type { Card, PlayerCount, Seat, Suit } from './cards'

export interface Canto {
  seat: Seat
  suit: Suit
  points: number
  trick: number
  card: Card
}

export interface Breakdown {
  aces: number
  threes: number
  cantos: number
  last: number
}

export interface Score {
  points: number[]
  tricks: number[]
  monos: number[]
  breakdown: Breakdown[]
  tiebreak: boolean
  winners: Seat[]
}

interface ScoredTrick {
  plays: { card: Card }[]
  winner: Seat
}

export function trickPoints(trick: { plays: { card: Card }[] }): number {
  return trick.plays.reduce((sum, play) => sum + cardPoints(play.card), 0)
}

export function trickMonos(trick: { plays: { card: Card }[] }): number {
  return trick.plays.reduce((sum, play) => sum + cardMonos(play.card), 0)
}

function rankPoints(trick: ScoredTrick, rank: number): number {
  return trick.plays.reduce((sum, play) => sum + (play.card.rank === rank ? cardPoints(play.card) : 0), 0)
}

function best(values: number[], seats: Seat[]): Seat[] {
  const top = Math.max(...seats.map((seat) => values[seat]))
  return seats.filter((seat) => values[seat] === top)
}

export function tally(tricks: ScoredTrick[], players: PlayerCount, cantos: Canto[], finished: boolean): Score {
  const breakdown: Breakdown[] = Array.from({ length: players }, () => ({ aces: 0, threes: 0, cantos: 0, last: 0 }))
  const won: number[] = Array(players).fill(0)
  const monos: number[] = Array(players).fill(0)
  for (const trick of tricks) {
    const entry = breakdown[trick.winner]
    entry.aces += rankPoints(trick, 1)
    entry.threes += rankPoints(trick, 3)
    won[trick.winner] += 1
    monos[trick.winner] += trickMonos(trick)
  }
  const lastTrick = tricks.at(-1)
  if (finished && lastTrick) breakdown[lastTrick.winner].last = LAST_TRICK_POINTS
  for (const canto of cantos) breakdown[canto.seat].cantos += canto.points
  const points = breakdown.map((entry) => entry.aces + entry.threes + entry.cantos + entry.last)
  const leaders = best(points, Array.from({ length: players }, (_, seat) => seat))
  const tiebreak = leaders.length > 1
  const winners = tiebreak ? best(monos, leaders) : leaders
  return { points, tricks: won, monos, breakdown, tiebreak, winners }
}
