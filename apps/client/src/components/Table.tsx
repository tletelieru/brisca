import { useState } from 'react'
import type { Level } from '@brisca/bots'
import { handSize, playRequirement, sameCard, score, tricksPerMatch } from '@brisca/engine'
import type { MatchState, PlayerCount, Seat } from '@brisca/engine'
import { useMessages } from '../i18n/messages'
import type { Messages } from '../i18n/messages'
import { playerNames, seatName } from '../lib/names'
import { seatPosition } from '../lib/cards'
import type { SeatPosition } from '../lib/cards'
import { landedFor } from '../lib/deal'
import { recordMatch } from '../lib/history'
import { breakdownLine } from '../lib/score'
import { clearSavedMatch } from '../lib/savedMatch'
import { HUMAN, useMatch } from '../useMatch'
import { BotHand } from './BotHand'
import { DealAnimation } from './DealAnimation'
import { Hand } from './Hand'
import { MatchResult } from './MatchResult'
import { Overlay } from './Overlay'
import { PlayerBadge } from './PlayerBadge'
import { ResultEffect } from './ResultEffect'
import { ScoreTable } from './ScoreTable'
import { TrickArea } from './TrickArea'
import { TricksPanel } from './TricksPanel'
import { TrumpCard } from './TrumpCard'

interface Props {
  players: PlayerCount
  seed: number
  level: Level
  restored: MatchState | null
  onExit: () => void
}

function hasPlays(state: MatchState): boolean {
  return state.tricks.length > 0 || state.current.length > 0
}

function resultTitle(t: Messages, winners: number[], mine: number): string {
  if (!winners.includes(mine)) return t.youLost
  if (winners.length > 1) return t.tieResult
  return t.youWon
}

export function Table({ players, seed, level, restored, onExit }: Props) {
  const t = useMessages()
  const { state, holding, drawing, drawPhase, spot, dealing, deal, legal, call, play } = useMatch(
    players,
    seed,
    level,
    restored,
  )
  const [scoresOpen, setScoresOpen] = useState(false)
  const [tricksOpen, setTricksOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const myTricks = state.tricks.filter((trick) => trick.winner === HUMAN)
  const live = score(state)
  const lastTrick = state.tricks.at(-1)
  const shownPlays = holding && lastTrick ? lastTrick.plays : state.current
  const matchEnded = state.status === 'matchOver' && !holding
  const humanWon = live.winners.includes(HUMAN) && live.winners.length === 1
  const names = playerNames(t, players)
  const trumpHeld = state.hands[state.dealer].some((card) => sameCard(card, state.trump))
  const requirement = playRequirement(state.hands[HUMAN], state.current, state.trump.suit)
  const lead = state.current[0]?.card.suit ?? null

  const seatTricks = (seat: Seat) => state.tricks.filter((trick) => trick.winner === seat)
  const details = (monos: boolean) =>
    live.breakdown.map((entry, seat) =>
      breakdownLine(t, entry, monos && live.tiebreak ? live.monos[seat] : null),
    )
  const visibleFor = (seat: Seat) =>
    deal.trumpUp ? handSize(players) : landedFor(seat, deal.landed, state.dealer, players)
  const active = (seat: Seat) => state.status === 'playing' && !holding && state.turn === seat

  const badge = (seat: Seat) => (
    <PlayerBadge
      name={seatName(t, seat)}
      tricks={seatTricks(seat).length}
      points={live.points[seat]}
      dealer={!drawing && state.dealer === seat}
      active={active(seat)}
      spotlight={spot === seat}
    />
  )

  const seatAt = (position: SeatPosition) =>
    Array.from({ length: players }, (_, seat) => seat).find(
      (seat) => seatPosition(seat, players) === position,
    )

  const line = (seat: Seat | undefined, vertical: boolean) => {
    if (seat === undefined) return null
    return (
      <BotHand
        key={seat}
        cards={Math.min(state.hands[seat].length, visibleFor(seat))}
        active={active(seat)}
        vertical={vertical}
        turned={deal.trumpUp && trumpHeld && seat === state.dealer ? state.trump : null}
      />
    )
  }

  const opponents = (['left', 'top', 'right'] as const).flatMap((position) => {
    const seat = seatAt(position)
    return seat === undefined ? [] : [seat]
  })

  return (
    <main className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-x-clip overflow-y-auto overscroll-contain">
      <div className="flex items-center gap-2">
        <TrumpCard
          trump={state.trump}
          revealed={deal.trumpUp}
          drawing={drawing}
          held={trumpHeld}
          holder={state.dealer === HUMAN ? null : seatName(t, state.dealer)}
          onClick={() => setScoresOpen(true)}
        />
        {[
          { label: t.scoreTitle, onClick: () => setScoresOpen(true) },
          { label: t.exit, onClick: () => setExitOpen(true) },
        ].map(({ label, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="pixel-button bg-raised px-3 py-1 text-ink"
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`flex gap-1 ${opponents.length === 1 ? 'justify-center' : 'justify-between'}`}>
        {opponents.map((seat) => (
          <div key={seat}>{badge(seat)}</div>
        ))}
      </div>

      {line(seatAt('top'), false)}

      <div className="flex flex-1 items-center gap-2">
        {line(seatAt('left'), true)}
        <div className="relative min-w-0 flex-1">
          {call && (
            <div aria-live="assertive" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <span key={call.id} className="score-pop pixel-box bg-gold px-3 py-1 font-pixel text-3xl leading-none text-surface">
                {t.cantoCall(seatName(t, call.seat), call.points)}
              </span>
            </div>
          )}
          <TrickArea
            plays={shownPlays}
            players={players}
            trump={state.trump.suit}
            collectedBy={holding && lastTrick ? lastTrick.winner : null}
            hints={level === 'easy'}
          />
        </div>
        {line(seatAt('right'), true)}
      </div>

      <Hand
        header={
          <>
            {badge(HUMAN)}
            <button
              type="button"
              onClick={() => setTricksOpen(true)}
              className="min-w-32 pixel-box bg-raised px-2 py-1 text-xs font-medium tabular-nums"
            >
              {t.myTricks(myTricks.length)}
            </button>
          </>
        }
        hand={state.hands[HUMAN]}
        trump={state.trump}
        turned={deal.trumpUp && trumpHeld && state.dealer === HUMAN}
        legal={legal}
        rule={requirement.rule}
        lead={lead}
        dealing={dealing}
        visible={visibleFor(HUMAN)}
        notice={drawPhase === 'reveal' ? t.dealerIs(seatName(t, state.dealer)) : null}
        onPlay={play}
      />

      {dealing && <DealAnimation players={players} dealer={state.dealer} />}

      {exitOpen && (
        <Overlay title={t.exitTitle} onClose={() => setExitOpen(false)}>
          <p className="font-pixel text-xl leading-tight text-muted">{t.exitBody}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setExitOpen(false)}
              className="pixel-button bg-raised py-2.5 text-ink"
            >
              {t.keepPlaying}
            </button>
            <button
              type="button"
              onClick={() => {
                if (state.status === 'playing' && hasPlays(state)) recordMatch(state, seed, level, true)
                clearSavedMatch()
                onExit()
              }}
              className="pixel-button bg-rose-700 py-2.5 text-white"
            >
              {t.exitConfirm}
            </button>
          </div>
        </Overlay>
      )}

      {tricksOpen && state.status === 'playing' && (
        <Overlay title={t.myTricks(myTricks.length)} translucent onClose={() => setTricksOpen(false)}>
          <TricksPanel
            tricks={myTricks}
            allTricks={state.tricks}
            trump={state.trump.suit}
            cantos={state.cantos}
          />
          <button
            type="button"
            onClick={() => setTricksOpen(false)}
            className="pixel-box bg-raised py-2 font-medium"
          >
            {t.close}
          </button>
        </Overlay>
      )}

      {scoresOpen && (
        <Overlay title={t.scoreTitle} onClose={() => setScoresOpen(false)}>
          <ScoreTable names={names} points={live.points} tricks={live.tricks} details={details(false)} />
          <p className="text-xs text-muted">{t.liveScore(tricksPerMatch(players) - state.tricks.length)}</p>
          <button
            type="button"
            onClick={() => setScoresOpen(false)}
            className="pixel-box bg-raised py-2 font-medium"
          >
            {t.close}
          </button>
        </Overlay>
      )}

      {matchEnded && <ResultEffect won={humanWon} />}

      {matchEnded && (
        <Overlay title={t.matchFinished}>
          <p
            className={`text-center font-pixel text-4xl leading-none text-gold ${
              humanWon ? 'result-win' : 'result-lose'
            }`}
          >
            {resultTitle(t, live.winners, HUMAN)}
          </p>
          <MatchResult names={names} state={state} result={live} />
          {live.tiebreak && <p className="text-center text-sm text-muted">{t.tiebreakNote}</p>}
          <ScoreTable
            names={names}
            points={live.points}
            tricks={live.tricks}
            winners={live.winners}
            details={details(true)}
          />
          <button
            type="button"
            onClick={onExit}
            className="w-full pixel-box bg-accent py-2 font-medium text-on-accent"
          >
            {t.backHome}
          </button>
        </Overlay>
      )}
    </main>
  )
}
