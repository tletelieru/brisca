import { easyBot, easyPolicy } from './easy'
import { countingPolicy } from './hard'
import { createSearchBot } from './search'
import type { Bot, Level } from './types'

export { createRng, easyBot, randomBot } from './easy'
export { countingBot } from './hard'
export { inferCaps, sampleWorld, trumpHolder, unseenCards } from './knowledge'
export { createSearchBot, solveEndgame } from './search'
export type { Bot, Level, Rng } from './types'

export const MEDIUM_ITERATIONS = 4
export const HARD_ITERATIONS = 48
export const MEDIUM_BUDGET_MS = 60
export const HARD_BUDGET_MS = 120
export const HARD_EXACT_CARDS = 9

export function createMediumBot(iterations = MEDIUM_ITERATIONS, budgetMs = MEDIUM_BUDGET_MS): Bot {
  return createSearchBot({ iterations, counting: false, exactCards: 0, budgetMs, policy: easyPolicy })
}

export function createHardBot(iterations = HARD_ITERATIONS, budgetMs = HARD_BUDGET_MS): Bot {
  return createSearchBot({ iterations, counting: true, exactCards: HARD_EXACT_CARDS, budgetMs, policy: countingPolicy })
}

export const mediumBot = createMediumBot()

export const hardBot = createHardBot()

export const BOTS: Record<Level, Bot> = {
  easy: easyBot,
  medium: mediumBot,
  hard: hardBot,
}
