import { createDeck, dealOrder } from '@brisca/engine'
import type { PlayerCount, Seat } from '@brisca/engine'

export const CARD_STEP_MS = 40

export const PACKET_GAP_MS = 100

export const FLIGHT_MS = 400

export const TRUMP_DELAY_MS = 350

const SETTLE_MS = 300

export function dealTotal(players: PlayerCount): number {
  return createDeck(players).length
}

export function seatForCard(index: number, dealer: Seat, players: PlayerCount): Seat {
  return dealOrder(dealer, players)[index]
}

function packetsBefore(index: number, players: PlayerCount): number {
  const order = dealOrder(0, players)
  let packets = 0
  for (let step = 1; step <= index; step++) {
    if (order[step] !== order[step - 1]) packets += 1
  }
  return packets
}

export function launchTime(index: number, players: PlayerCount): number {
  return index * CARD_STEP_MS + packetsBefore(index, players) * PACKET_GAP_MS
}

export function landTime(index: number, players: PlayerCount): number {
  return launchTime(index, players) + FLIGHT_MS
}

export function trumpTime(players: PlayerCount): number {
  return landTime(dealTotal(players) - 1, players) + TRUMP_DELAY_MS
}

export function dealHoldMs(players: PlayerCount): number {
  return trumpTime(players) + SETTLE_MS
}

export function landedFor(seat: Seat, landed: number, dealer: Seat, players: PlayerCount): number {
  return dealOrder(dealer, players)
    .slice(0, landed)
    .filter((target) => target === seat).length
}
