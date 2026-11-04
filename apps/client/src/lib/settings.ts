import type { Level } from '@brisca/bots'

export const levelKey = 'bot-level'

export function readLevel(): Level {
  const saved = localStorage.getItem(levelKey)
  if (saved === 'easy' || saved === 'hard') return saved
  return 'medium'
}

export const plainFontKey = 'plain-font'

export function readPlainFont(): boolean {
  return localStorage.getItem(plainFontKey) === 'on'
}

export const reduceMotionKey = 'reduce-motion'

export function readReduceMotion(): boolean {
  return localStorage.getItem(reduceMotionKey) === 'on'
}

export const soundsKey = 'sounds'

export function readSounds(): boolean {
  return localStorage.getItem(soundsKey) !== 'off'
}

export const musicKey = 'music'

export function readMusic(): boolean {
  return localStorage.getItem(musicKey) !== 'off'
}
