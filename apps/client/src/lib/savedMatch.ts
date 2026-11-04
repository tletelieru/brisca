import type { Level } from '@brisca/bots'
import type { MatchState } from '@brisca/engine'

export interface SavedMatch {
  state: MatchState
  seed: number
  level: Level
}

export const savedMatchKey = 'saved-match'

export function readSavedMatch(): SavedMatch | null {
  try {
    const saved = JSON.parse(localStorage.getItem(savedMatchKey) ?? 'null') as SavedMatch | null
    const state = saved?.state
    if (!state?.hands || !state.trump || 'stock' in state || !Array.isArray(state.cantos)) return null
    if (state.players !== 3 && state.players !== 4) return null
    return saved
  } catch {
    return null
  }
}

export function writeSavedMatch(match: SavedMatch): void {
  localStorage.setItem(savedMatchKey, JSON.stringify(match))
}

export function clearSavedMatch(): void {
  localStorage.removeItem(savedMatchKey)
}
