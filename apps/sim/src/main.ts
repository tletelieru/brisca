import { parseArgs } from 'node:util'
import { createHardBot, createMediumBot, createRng, easyBot, randomBot } from '@brisca/bots'
import type { Bot } from '@brisca/bots'
import { applyAction, createMatch, legalActions, score, viewFor } from '@brisca/engine'
import type { PlayerCount, Seat } from '@brisca/engine'

const { values } = parseArgs({
  options: {
    matches: { type: 'string', default: '400' },
    players: { type: 'string', default: '3,4' },
    seed: { type: 'string', default: '1' },
    hero: { type: 'string' },
    field: { type: 'string' },
    iterations: { type: 'string' },
  },
})

const iterations = values.iterations === undefined ? undefined : Number(values.iterations)

const CATALOG: Record<string, Bot> = {
  random: randomBot,
  easy: easyBot,
  medium: createMediumBot(iterations, Infinity),
  hard: createHardBot(iterations, Infinity),
}

const LADDER: [string, string][] = [
  ['easy', 'random'],
  ['medium', 'easy'],
  ['hard', 'medium'],
  ['hard', 'easy'],
]

const matches = Number(values.matches)
const firstSeed = Number(values.seed)
const counts = values.players.split(',').map(Number) as PlayerCount[]
const ladder: [string, string][] =
  values.hero && values.field ? [[values.hero, values.field]] : LADDER

const valid =
  Number.isInteger(matches) &&
  matches > 0 &&
  counts.every((players) => players === 3 || players === 4) &&
  ladder.every(([hero, field]) => CATALOG[hero] && CATALOG[field])

if (!valid) {
  console.error(
    'Usage: pnpm sim --matches <n> --players <3,4> [--hero <bot> --field <bot>] [--iterations <n>]',
  )
  console.error(`Bots: ${Object.keys(CATALOG).join(', ')}`)
  process.exit(1)
}

interface Outcome {
  wins: number
  ties: number
  points: number
  moves: number
  thinking: number
  slowest: number
}

function playMatch(players: PlayerCount, seed: number, heroSeat: Seat, hero: Bot, field: Bot, outcome: Outcome) {
  const rng = createRng(seed)
  let state = createMatch({ players }, seed)
  while (state.status === 'playing') {
    const seat = state.turn
    const bot = seat === heroSeat ? hero : field
    const started = performance.now()
    const action = bot.choose(viewFor(state, seat), legalActions(state, seat), rng)
    const spent = performance.now() - started
    if (seat === heroSeat) {
      outcome.moves += 1
      outcome.thinking += spent
      outcome.slowest = Math.max(outcome.slowest, spent)
    }
    state = applyAction(state, action)
  }
  return score(state)
}

function run(players: PlayerCount, hero: Bot, field: Bot): Outcome {
  const outcome: Outcome = { wins: 0, ties: 0, points: 0, moves: 0, thinking: 0, slowest: 0 }
  for (let index = 0; index < matches; index++) {
    const heroSeat = index % players
    const result = playMatch(players, firstSeed + Math.floor(index / players), heroSeat, hero, field, outcome)
    outcome.points += result.points[heroSeat]
    if (!result.winners.includes(heroSeat)) continue
    if (result.winners.length > 1) outcome.ties += 1
    else outcome.wins += 1
  }
  return outcome
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

console.log('| Bot | Against | Players | Matches | Wins | Ties | Avg points | Even odds | Avg ms/move | Max ms/move |')
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')

for (const players of counts) {
  for (const [heroName, fieldName] of ladder) {
    const { wins, ties, points, moves, thinking, slowest } = run(players, CATALOG[heroName], CATALOG[fieldName])
    const rate = wins / matches
    const margin = 1.96 * Math.sqrt((rate * (1 - rate)) / matches)
    console.log(
      `| ${heroName} | ${fieldName} | ${players} | ${matches} | ${percent(rate)} ±${(margin * 100).toFixed(1)} | ${percent(ties / matches)} | ${(points / matches).toFixed(1)} | ${percent(1 / players)} | ${(thinking / moves).toFixed(2)} | ${slowest.toFixed(1)} |`,
    )
  }
}
