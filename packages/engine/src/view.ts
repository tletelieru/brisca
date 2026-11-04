import type { Card, PlayerCount, Seat } from './cards'
import type { MatchState, MatchStatus, Play, Trick } from './match'
import type { Canto } from './scoring'

export interface PlayerView {
  seat: Seat
  players: PlayerCount
  dealer: Seat
  turn: Seat
  hand: Card[]
  handCounts: number[]
  trump: Card
  current: Play[]
  tricks: Trick[]
  cantos: Canto[]
  status: MatchStatus
}

export function viewFor(state: MatchState, seat: Seat): PlayerView {
  return {
    seat,
    players: state.players,
    dealer: state.dealer,
    turn: state.turn,
    hand: state.hands[seat],
    handCounts: state.hands.map((hand) => hand.length),
    trump: state.trump,
    current: state.current,
    tricks: state.tricks,
    cantos: state.cantos,
    status: state.status,
  }
}
