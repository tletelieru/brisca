const LOOKAHEAD_SECONDS = 0.3
const TICK_MS = 100
const MASTER_VOLUME = 0.5
const STEPS_PER_CHORD = 16

const REST = 0

export type TrackId = 'intro' | 'match' | 'lastCards'

export interface Track {
  bpm: number
  melody: number[]
  chords: number[][]
}

export const TRACKS: Record<TrackId, Track> = {
  intro: {
    bpm: 100,
    melody: [
      76, REST, 74, 72, 74, REST, 72, 71, 69, REST, REST, REST, 72, REST, 71, REST,
      71, REST, 72, 74, 72, REST, 71, 69, 67, REST, REST, REST, 71, REST, 69, REST,
      69, REST, 71, 72, 71, REST, 69, 67, 65, REST, REST, REST, 69, REST, 67, REST,
      68, REST, 69, 71, 68, REST, 65, 64, 64, REST, REST, REST, REST, REST, REST, REST,
    ],
    chords: [
      [45, 57, 60, 64],
      [43, 55, 59, 62],
      [41, 53, 57, 60],
      [40, 52, 56, 59],
    ],
  },
  match: {
    bpm: 108,
    melody: [
      69, 72, 76, REST, 77, 76, 74, 76, 72, REST, 69, REST, 72, 71, 69, REST,
      67, 71, 74, REST, 76, 74, 72, 74, 71, REST, 67, REST, 71, 69, 67, REST,
      65, 69, 72, REST, 74, 72, 71, 72, 69, REST, 65, REST, 69, 67, 65, REST,
      64, 65, 68, 71, 72, 71, 69, 68, 65, 64, REST, 68, 71, REST, 64, REST,
    ],
    chords: [
      [45, 57, 60, 64],
      [43, 55, 59, 62],
      [41, 53, 57, 60],
      [40, 52, 56, 59],
    ],
  },
  lastCards: {
    bpm: 112,
    melody: [
      76, REST, 76, 77, 76, REST, 74, REST, 76, REST, 72, REST, 69, REST, 72, REST,
      77, REST, 77, 79, 77, REST, 76, REST, 74, REST, 70, REST, 74, REST, 77, REST,
      76, REST, 74, 72, 74, REST, 72, 71, 72, REST, 69, REST, 72, REST, 76, REST,
      77, 76, 74, 72, 71, REST, 68, REST, 71, REST, 74, REST, 76, REST, REST, REST,
    ],
    chords: [
      [45, 57, 60, 64],
      [46, 58, 62, 65],
      [45, 57, 60, 64],
      [40, 52, 56, 59],
    ],
  },
}

function stepSeconds(track: Track): number {
  return 60 / track.bpm / 2
}

function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function playTone(
  context: AudioContext,
  output: AudioNode,
  midi: number,
  time: number,
  length: number,
  type: OscillatorType,
  volume: number,
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = type
  oscillator.frequency.value = frequency(midi)
  gain.gain.setValueAtTime(volume, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + length)
  oscillator.connect(gain).connect(output)
  oscillator.start(time)
  oscillator.stop(time + length)
}

const WIN_NOTES = [72, 76, 79, 84, 79, 84, 88]
const LOSE_NOTES = [69, 67, 64, 62, 60, 57]
const WIN_STEP_SECONDS = 0.14
const LOSE_STEP_SECONDS = 0.34

function scheduleStep(
  context: AudioContext,
  output: AudioNode,
  track: Track,
  step: number,
  time: number,
): void {
  const length = stepSeconds(track)
  const note = track.melody[step % track.melody.length]
  if (note !== REST) playTone(context, output, note, time, length * 1.8, 'square', 0.035)
  const position = step % (STEPS_PER_CHORD * track.chords.length)
  const chord = track.chords[Math.floor(position / STEPS_PER_CHORD)]
  const inChord = position % STEPS_PER_CHORD
  if (inChord % 4 === 0) playTone(context, output, chord[0], time, length * 1.4, 'triangle', 0.16)
  if (inChord % 2 === 1) {
    playTone(context, output, chord[1 + (inChord >> 1) % 3], time, length, 'triangle', 0.05)
  }
}

export interface Music {
  play: () => void
  pause: () => void
  jingle: (won: boolean) => void
  setTrack: (id: TrackId) => void
}

export function createMusic(initial: TrackId = 'intro'): Music | null {
  if (typeof AudioContext === 'undefined') return null
  let context: AudioContext | null = null
  let output: GainNode | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let step = 0
  let track = TRACKS[initial]
  let nextTime = 0

  const tick = () => {
    if (!context || !output) return
    while (nextTime < context.currentTime + LOOKAHEAD_SECONDS) {
      scheduleStep(context, output, track, step, nextTime)
      step += 1
      nextTime += stepSeconds(track)
    }
  }

  return {
    play() {
      if (!context) {
        context = new AudioContext()
        output = context.createGain()
        output.gain.value = MASTER_VOLUME
        output.connect(context.destination)
        nextTime = context.currentTime + 0.05
      }
      void context.resume()
      timer ??= setInterval(tick, TICK_MS)
    },
    pause() {
      if (timer !== null) clearInterval(timer)
      timer = null
      void context?.suspend()
    },
    setTrack(id) {
      if (track === TRACKS[id]) return
      track = TRACKS[id]
      step = 0
    },
    jingle(won) {
      if (!context || !output) return
      const notes = won ? WIN_NOTES : LOSE_NOTES
      const length = won ? WIN_STEP_SECONDS : LOSE_STEP_SECONDS
      const start = context.currentTime + 0.05
      notes.forEach((note, index) => {
        const time = start + index * length
        playTone(context!, output!, note, time, length * 1.6, won ? 'square' : 'triangle', 0.07)
      })
      nextTime = start + notes.length * length + 1
    },
  }
}
