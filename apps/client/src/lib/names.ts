import type { PlayerCount, Seat } from '@brisca/engine'
import type { Messages } from '../i18n/messages'

export const HUMAN_SEAT = 0

export function seatName(t: Messages, seat: Seat): string {
  return seat === HUMAN_SEAT ? t.you : t.bot(seat)
}

export function playerNames(t: Messages, players: PlayerCount): string[] {
  return Array.from({ length: players }, (_, seat) => seatName(t, seat))
}
