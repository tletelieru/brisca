import { describe, expect, it } from 'vitest'
import { DRAW_MS, drawSequence } from './dealerDraw'

describe('drawSequence', () => {
  it.each([
    [3, 0],
    [3, 2],
    [4, 0],
    [4, 3],
  ] as const)('with %i players stops on dealer %i after at least one lap', (players, dealer) => {
    const steps = drawSequence(players, dealer)
    expect(steps.at(-1)!.seat).toBe(dealer)
    expect(steps.length - 1).toBeGreaterThanOrEqual(players)
    expect(new Set(steps.map((step) => step.seat)).size).toBe(players)
    steps.slice(1).forEach((step, index) => {
      expect(step.seat).toBe((steps[index].seat + 1) % players)
    })
  })

  it('lasts about two seconds and slows down', () => {
    const steps = drawSequence(4, 2)
    expect(Math.abs(steps.at(-1)!.at - DRAW_MS)).toBeLessThanOrEqual(2)
    const gaps = steps.slice(1).map((step, index) => step.at - steps[index].at)
    expect(gaps.at(-1)!).toBeGreaterThan(gaps[0] * 3)
    gaps.slice(1).forEach((gap, index) => expect(gap).toBeGreaterThanOrEqual(gaps[index] - 1))
  })
})
