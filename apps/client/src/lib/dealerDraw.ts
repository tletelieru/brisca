import type { PlayerCount, Seat } from '@brisca/engine'

export interface DrawStep {
  seat: Seat
  at: number
}

export const DRAW_MS = 2000

export const REVEAL_MS = 800

const MIN_HOPS = 6

const START_SEAT = 0

const SLOWDOWN = 6

export function drawSequence(players: PlayerCount, dealer: Seat): DrawStep[] {
  const laps = Math.max(1, Math.ceil(MIN_HOPS / players))
  const hops = laps * players + ((dealer - START_SEAT + players) % players)
  const weights = Array.from({ length: hops }, (_, index) => 1 + SLOWDOWN * ((index + 1) / hops) ** 2)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const steps: DrawStep[] = [{ seat: START_SEAT, at: 0 }]
  let at = 0
  weights.forEach((weight, index) => {
    at += (DRAW_MS * weight) / total
    steps.push({ seat: (START_SEAT + index + 1) % players, at: Math.round(at) })
  })
  return steps
}

export function prefersQuickDraw(): boolean {
  if (document.documentElement.classList.contains('reduce-motion')) return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}
