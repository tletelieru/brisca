import { createMatch } from '@brisca/engine'
import { describe, expect, it } from 'vitest'
import { TRACKS } from './music'
import { RESULT_SOUNDS, SETUP_TRACKS, outcomeFor, trackForMatch } from './sound'

const ANDALUSIAN_ROOTS = [45, 43, 41, 40]

describe('music tracks', () => {
  it('keeps every track valid', () => {
    for (const track of Object.values(TRACKS)) {
      expect(track.melody).toHaveLength(64)
      expect(track.chords).toHaveLength(4)
      expect(track.bpm).toBeGreaterThanOrEqual(100)
      expect(track.bpm).toBeLessThanOrEqual(112)
      track.melody.forEach((note) => expect(note === 0 || (note >= 55 && note <= 84)).toBe(true))
      track.chords.forEach((chord) => expect(chord).toHaveLength(4))
    }
  })

  it('gives every track its own melody and tempo', () => {
    const tracks = Object.values(TRACKS)
    expect(new Set(tracks.map((track) => track.melody.join())).size).toBe(tracks.length)
    expect(new Set(tracks.map((track) => track.bpm)).size).toBe(tracks.length)
  })

  it('walks the Andalusian cadence on the start screen and in the match', () => {
    expect(TRACKS.intro.chords.map((chord) => chord[0])).toEqual(ANDALUSIAN_ROOTS)
    expect(TRACKS.match.chords.map((chord) => chord[0])).toEqual(ANDALUSIAN_ROOTS)
  })

  it('maps every setup to a track', () => {
    expect(SETUP_TRACKS).toEqual({ home: 'intro', match: 'match', lastCards: 'lastCards' })
    const match = createMatch({ players: 3 }, 3)
    expect(trackForMatch(null)).toBe('intro')
    expect(trackForMatch(match)).toBe('match')
    const hands = match.hands.map((hand, seat) => (seat === 0 ? hand.slice(0, 3) : hand))
    expect(trackForMatch({ ...match, hands })).toBe('lastCards')
    expect(trackForMatch({ ...match, hands: match.hands.map((hand) => hand.slice(0, 4)) })).toBe('match')
  })

  it('picks a happy or sad jingle from the outcome of your side', () => {
    expect(RESULT_SOUNDS[outcomeFor([0], 0)]).toBe('win')
    expect(RESULT_SOUNDS[outcomeFor([1], 0)]).toBe('lose')
    expect(RESULT_SOUNDS[outcomeFor([0, 1], 0)]).toBe('chime')
  })
})
