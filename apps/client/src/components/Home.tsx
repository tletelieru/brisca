import type { Level } from '@brisca/bots'
import type { Card, PlayerCount } from '@brisca/engine'
import { useMessages } from '../i18n/messages'
import { HeroCard, SpanishCard } from './SpanishCard'

interface Props {
  level: Level
  onLevel: (level: Level) => void
  onRules: () => void
  onHistory: () => void
  onStart: (players: PlayerCount) => void
}

const FAN: { card: Card; tilt: number; lift: number }[] = [
  { card: { suit: 'copas', rank: 3 }, tilt: -8, lift: 10 },
  { card: { suit: 'oros', rank: 1 }, tilt: 0, lift: 0 },
  { card: { suit: 'espadas', rank: 12 }, tilt: 8, lift: 10 },
]

const PLAYER_OPTIONS: PlayerCount[] = [3, 4]

const LEVELS: Level[] = ['easy', 'medium', 'hard']

const POINT_CARDS: { cards: Card[]; marked: boolean }[] = [
  { cards: [{ suit: 'oros', rank: 1 }], marked: false },
  { cards: [{ suit: 'copas', rank: 3 }], marked: false },
  { cards: [], marked: false },
  {
    cards: [
      { suit: 'espadas', rank: 12 },
      { suit: 'espadas', rank: 11 },
    ],
    marked: false,
  },
  {
    cards: [
      { suit: 'bastos', rank: 12 },
      { suit: 'bastos', rank: 11 },
    ],
    marked: true,
  },
]

export function Home({ level, onLevel, onRules, onHistory, onStart }: Props) {
  const t = useMessages()

  return (
    <main className="flex flex-col items-center gap-6">
      <div aria-hidden="true" className="flex justify-center pt-6">
        {FAN.map(({ card, tilt, lift }) => (
          <HeroCard
            key={`${card.suit}-${card.rank}`}
            card={card}
            tilt={tilt}
            lift={lift}
            front={tilt === 0}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-pixel text-6xl leading-none">{t.appName}</h1>
        <p className="text-muted">{t.tagline}</p>
      </div>
      <div role="group" aria-label={t.difficulty} className="flex w-full flex-col gap-1">
        <span className="text-center text-sm text-muted">
          {t.difficulty}: {t.levelHints[level]}
        </span>
        <div className="grid grid-cols-3 gap-1 pixel-box bg-surface p-1">
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={level === option}
              onClick={() => onLevel(option)}
              className={`pixel-box py-1.5 text-sm font-medium ${
                level === option ? 'bg-raised' : 'text-muted'
              }`}
            >
              {t.levels[option]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        {PLAYER_OPTIONS.map((players) => (
          <button
            key={players}
            type="button"
            aria-label={t.playWith(players)}
            onClick={() => onStart(players)}
            className="flex flex-col items-center gap-1 pixel-box bg-accent py-2.5 text-on-accent"
          >
            <span className="font-pixel text-4xl leading-none">{players}</span>
            <span className="text-xs leading-none">{t.playMode(players)}</span>
          </button>
        ))}
      </div>
      <section className="flex w-full flex-col gap-3 pixel-box bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-pixel text-2xl leading-none">{t.pointsTitle}</h2>
          <div className="flex gap-1">
            {[
              { label: t.history, onClick: onHistory },
              { label: t.rules, onClick: onRules },
            ].map(({ label, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="pixel-box bg-raised px-2 py-1 text-xs font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ol className="flex flex-col gap-1.5">
          {t.pointsRows.map((row, index) => (
            <li key={row.label} className="flex items-center gap-2 pixel-box bg-raised px-2 py-1.5">
              <span aria-hidden="true" className="flex w-16 shrink-0 justify-center">
                {POINT_CARDS[index].cards.map((card) => (
                  <span key={`${card.suit}-${card.rank}`} className="-mr-2 last:mr-0">
                    <SpanishCard card={card} size="sm" marked={POINT_CARDS[index].marked} />
                  </span>
                ))}
                {POINT_CARDS[index].cards.length === 0 && <span className="block h-11 w-7 back-pattern" />}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-sm">{row.label}</span>
                <span className="block text-xs text-muted">{row.detail}</span>
              </span>
              <span className="font-pixel text-2xl leading-none text-gold">{row.points}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm leading-tight text-muted">{t.pointsHint}</p>
      </section>
    </main>
  )
}
