import { createContext } from 'react'
import type { Action, MatchState } from '@brisca/engine'
import type { Music, TrackId } from './music'
import { HUMAN_SEAT } from './names'

export type SfxId = 'tick' | 'chime' | 'card' | 'knock' | 'win' | 'lose'

export type DrawEvent = 'hop' | 'stop'

export interface Sfx {
  play(id: SfxId): void
}

interface Tone {
  notes: number[]
  step: number
  length: number
  wave: OscillatorType
  volume: number
}

function midi(note: number): number {
  return 440 * 2 ** ((note - 69) / 12)
}

const TONES: Record<SfxId, Tone> = {
  tick: { notes: [1046], step: 0, length: 0.035, wave: 'square', volume: 0.05 },
  card: { notes: [330, 220], step: 0.03, length: 0.06, wave: 'triangle', volume: 0.08 },
  knock: { notes: [98, 98, 98], step: 0.11, length: 0.07, wave: 'square', volume: 0.14 },
  win: { notes: [72, 76, 79, 84, 79, 84, 88].map(midi), step: 0.13, length: 0.2, wave: 'square', volume: 0.07 },
  lose: { notes: [69, 67, 64, 62, 60, 57].map(midi), step: 0.3, length: 0.45, wave: 'triangle', volume: 0.1 },
  chime: { notes: [784, 1046, 1568], step: 0.07, length: 0.22, wave: 'triangle', volume: 0.12 },
}

export const DRAW_SOUNDS: Record<DrawEvent, SfxId> = {
  hop: 'tick',
  stop: 'chime',
}

export const ACTION_SOUNDS: Record<Action['type'], SfxId | null> = {
  play: 'card',
}

export type Outcome = 'won' | 'tied' | 'lost'

export const RESULT_SOUNDS: Record<Outcome, SfxId> = {
  won: 'win',
  tied: 'chime',
  lost: 'lose',
}

export function outcomeFor(winners: number[], mine: number): Outcome {
  if (!winners.includes(mine)) return 'lost'
  if (winners.length > 1) return 'tied'
  return 'won'
}

export const SfxContext = createContext<Sfx | null>(null)

export function createSfx(): Sfx | null {
  if (typeof AudioContext === 'undefined') return null
  let context: AudioContext | null = null
  return {
    play(id) {
      context ??= new AudioContext()
      const tone = TONES[id]
      const start = context.currentTime
      tone.notes.forEach((frequency, index) => {
        const at = start + index * tone.step
        const oscillator = context!.createOscillator()
        const gain = context!.createGain()
        oscillator.type = tone.wave
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(tone.volume, at)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + tone.length)
        oscillator.connect(gain).connect(context!.destination)
        oscillator.start(at)
        oscillator.stop(at + tone.length)
      })
    },
  }
}

export type Setup = 'home' | 'match' | 'lastCards'

export const SETUP_TRACKS: Record<Setup, TrackId> = {
  home: 'intro',
  match: 'match',
  lastCards: 'lastCards',
}

export const MusicContext = createContext<Music | null>(null)

export const LAST_CARDS = 3

export function isLastCards(state: MatchState): boolean {
  return state.hands[HUMAN_SEAT].length <= LAST_CARDS
}

export function setupFor(state: MatchState | null): Setup {
  if (!state) return 'home'
  if (isLastCards(state)) return 'lastCards'
  return 'match'
}

export function trackForMatch(state: MatchState | null): TrackId {
  return SETUP_TRACKS[setupFor(state)]
}
