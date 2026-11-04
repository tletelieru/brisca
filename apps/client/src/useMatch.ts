import { useContext, useEffect, useEffectEvent, useState } from 'react'
import { BOTS, createRng } from '@brisca/bots'
import type { Level } from '@brisca/bots'
import { applyAction, createMatch, legalActions, score, viewFor } from '@brisca/engine'
import type { Action, Card, MatchState, PlayerCount } from '@brisca/engine'
import type { BotReply, BotRequest } from './botWorker'
import { recordMatch } from './lib/history'
import { HUMAN_SEAT } from './lib/names'
import { ACTION_SOUNDS, MusicContext, RESULT_SOUNDS, SETUP_TRACKS, SfxContext, isLastCards, outcomeFor } from './lib/sound'
import { dealHoldMs } from './lib/deal'
import { useDealProgress } from './useDealProgress'
import { useDealerDraw } from './useDealerDraw'
import { clearSavedMatch, writeSavedMatch } from './lib/savedMatch'

export const HUMAN = HUMAN_SEAT

let worker: Worker | null = null
let requestId = 0

function botWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  worker ??= new Worker(new URL('./botWorker.ts', import.meta.url), { type: 'module' })
  return worker
}

const BOT_DELAY = 650
const TRICK_HOLD = 1250
const CALL_MS = 1600

export interface CantoCall {
  id: number
  seat: number
  points: number
}

let callId = 0

function isFresh(state: MatchState): boolean {
  return state.tricks.length === 0 && state.current.length === 0
}

function holdKey(state: MatchState): string | null {
  if (isFresh(state)) return 'deal'
  if (state.current.length > 0) return null
  return `trick:${state.tricks.length}`
}

export function useMatch(
  players: PlayerCount,
  seed: number,
  level: Level,
  restored: MatchState | null,
) {
  const [state, setState] = useState(() => restored ?? createMatch({ players }, seed))
  const [rng] = useState(() => createRng(seed))
  const [heldKey, setHeldKey] = useState<string | null>(null)
  const [call, setCall] = useState<CantoCall | null>(null)
  const sfx = useContext(SfxContext)
  const music = useContext(MusicContext)
  const key = holdKey(state)
  const holding = key !== null && key !== heldKey
  const draw = useDealerDraw(state.players, state.dealer, restored === null)
  const drawing = draw.phase !== 'done'
  const dealing = !drawing && holding && isFresh(state)
  const deal = useDealProgress(state.players, restored === null, dealing)

  function finish(final: MatchState) {
    recordMatch(final, seed, level, false)
    const outcome = outcomeFor(score(final).winners, HUMAN)
    setTimeout(() => sfx?.play(RESULT_SOUNDS[outcome]), TRICK_HOLD)
  }

  function act(action: Action) {
    const next = applyAction(state, action)
    const sound = action.golpe ? 'knock' : ACTION_SOUNDS[action.type]
    if (sound) sfx?.play(sound)
    const canto = action.golpe ? next.cantos.at(-1) : undefined
    if (canto) {
      const id = (callId += 1)
      setCall({ id, seat: canto.seat, points: canto.points })
      setTimeout(() => setCall((shown) => (shown?.id === id ? null : shown)), CALL_MS)
    }
    if (isLastCards(next) && !isLastCards(state)) music?.setTrack(SETUP_TRACKS.lastCards)
    if (next.status === 'matchOver') finish(next)
    setState(next)
  }

  const actFromBot = useEffectEvent(act)

  // eslint-disable-next-line local/no-effect -- persists the match in progress to localStorage
  useEffect(() => {
    if (state.status === 'matchOver') clearSavedMatch()
    else writeSavedMatch({ state, seed, level })
  }, [state, seed, level])

  // eslint-disable-next-line local/no-effect -- runs bot turns with timers and the bot Web Worker
  useEffect(() => {
    if (drawing) return
    if (holding) {
      const timer = setTimeout(() => setHeldKey(key), isFresh(state) ? dealHoldMs(state.players) : TRICK_HOLD)
      return () => clearTimeout(timer)
    }
    const seat = state.turn
    if (state.status !== 'playing' || seat === HUMAN) return
    const view = viewFor(state, seat)
    const actions = legalActions(state, seat)
    const worker = level === 'easy' ? null : botWorker()
    if (!worker) {
      const timer = setTimeout(() => {
        actFromBot(BOTS[level].choose(view, actions, rng))
      }, BOT_DELAY)
      return () => clearTimeout(timer)
    }
    const id = (requestId += 1)
    let delayed = false
    let reply: Action | null = null
    const commit = () => {
      if (delayed && reply) actFromBot(reply)
    }
    const timer = setTimeout(() => {
      delayed = true
      commit()
    }, BOT_DELAY)
    worker.onmessage = (event: MessageEvent<BotReply>) => {
      if (event.data.id !== id) return
      reply = event.data.action
      commit()
    }
    const seed = Math.floor(rng() * 2 ** 31)
    worker.postMessage({ id, level, view, legal: actions, seed } satisfies BotRequest)
    return () => {
      clearTimeout(timer)
      worker.onmessage = null
    }
  }, [state, drawing, holding, key, rng, level])

  const legal: Action[] = drawing || holding ? [] : legalActions(state, HUMAN)

  return {
    state,
    holding,
    drawing,
    drawPhase: draw.phase,
    spot: draw.spot,
    dealing,
    deal,
    legal,
    call,
    play: (card: Card, golpe: boolean) => act({ type: 'play', seat: HUMAN, card, ...(golpe ? { golpe } : {}) }),
  }
}
