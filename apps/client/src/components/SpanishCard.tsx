import type { CSSProperties } from 'react'
import type { Card, Rank } from '@brisca/engine'
import { SUIT_ON_CARD, isFigure, rankLabel } from '../lib/cards'
import { PixelIcon } from './PixelIcon'
import { SpanishSuitIcon } from './SpanishSuitIcon'

export type CardSize = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  card: Card
  size?: CardSize
  highlight?: boolean
  marked?: boolean
}

interface HeroProps {
  card: Card
  tilt: number
  lift: number
  front?: boolean
}

const FIGURE_ART: Partial<Record<Rank, { rows: string[]; tone: string }>> = {
  10: {
    tone: 'text-card-ink',
    rows: ['..###..', '..###..', '...#...', '.#####.', '#.###.#', '..###..', '..#.#..'],
  },
  11: {
    tone: 'text-card-ink',
    rows: ['...#.#.', '..####.', '.######', '###.###', '##..###', '....###', '...####'],
  },
  12: {
    tone: 'text-gold',
    rows: ['.......', '#..#..#', '#.###.#', '#######', '#######', '.#####.', '.......'],
  },
}

function FigureArt({ rank, className }: { rank: Rank; className: string }) {
  const art = FIGURE_ART[rank]
  if (!art) return null
  return <PixelIcon rows={art.rows} className={`${className} ${art.tone}`} />
}

const SHAPE: Record<Exclude<CardSize, 'xl'>, { face: string; label: string; icon: string; ace: string; corner: string; opposite: string; figure: string; small: string }> = {
  sm: { face: 'h-11 w-7 border-2', label: 'text-lg', icon: 'size-3.5', ace: 'size-3.5', corner: '', opposite: '', figure: '', small: '' },
  md: {
    face: 'h-16 w-11 border-2',
    label: 'text-lg',
    icon: 'size-6',
    ace: 'size-8',
    corner: 'top-0.5 left-1',
    opposite: 'bottom-0.5 right-1',
    figure: 'size-4',
    small: 'size-3.5',
  },
  lg: {
    face: 'h-24 w-16 border-[3px]',
    label: 'text-2xl',
    icon: 'size-9',
    ace: 'size-11',
    corner: 'top-1 left-1.5',
    opposite: 'bottom-1 right-1.5',
    figure: 'size-7',
    small: 'size-5',
  },
}

function iconSize(rank: Rank, shape: { icon: string; ace: string; small: string }): string {
  if (isFigure(rank)) return shape.small
  if (rank === 1) return shape.ace
  return shape.icon
}

export function SpanishCard({ card, size = 'md', highlight = false, marked = false }: Props) {
  if (size === 'xl') return <HeroFace card={card} />
  const shape = SHAPE[size]
  const tone = SUIT_ON_CARD[card.suit]
  const edge = highlight ? 'border-gold' : 'border-card-ink'
  const fill = marked ? 'card-trump' : ''
  const label = rankLabel(card.rank)

  if (size === 'sm') {
    return (
      <span className="card-shadow block">
        <span
          className={`card-face flex flex-col items-center justify-center gap-0.5 font-pixel leading-none ${shape.face} ${shape.label} ${edge} ${tone} ${fill}`}
        >
          {label}
          <SpanishSuitIcon suit={card.suit} className={shape.icon} />
        </span>
      </span>
    )
  }

  const figure = isFigure(card.rank)
  const { corner, opposite } = shape

  return (
    <span className="card-shadow block">
      <span className={`card-face relative block font-pixel leading-none ${shape.face} ${edge} ${tone} ${fill}`}>
        {figure && <span className="absolute inset-1 border border-gold/70 bg-gold/15" />}
        <span className={`absolute ${corner} ${shape.label} leading-none`}>{label}</span>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <FigureArt rank={card.rank} className={shape.figure} />
          <SpanishSuitIcon suit={card.suit} className={iconSize(card.rank, shape)} />
        </span>
        <span className={`absolute ${opposite} rotate-180 ${shape.label} leading-none`}>{label}</span>
      </span>
    </span>
  )
}

function HeroFace({ card }: { card: Card }) {
  const label = rankLabel(card.rank)
  return (
    <div
      className={`card-face hero-card relative h-36 w-24 border-4 border-card-ink font-pixel sm:h-44 sm:w-30 ${
        SUIT_ON_CARD[card.suit]
      }`}
    >
      <span className="absolute inset-1.5 border-2 border-gold/50" />
      <span className="absolute top-2 left-3 flex flex-col items-center gap-0.5">
        <span className="text-3xl leading-none">{label}</span>
        <SpanishSuitIcon suit={card.suit} className="size-3.5" />
      </span>
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <FigureArt rank={card.rank} className="size-9 sm:size-11" />
        <SpanishSuitIcon suit={card.suit} className={isFigure(card.rank) ? 'size-7 sm:size-8' : 'size-10 sm:size-12'} />
      </span>
      <span className="absolute right-3 bottom-2 flex rotate-180 flex-col items-center gap-0.5">
        <span className="text-3xl leading-none">{label}</span>
        <SpanishSuitIcon suit={card.suit} className="size-3.5" />
      </span>
    </div>
  )
}

export function HeroCard({ card, tilt, lift, front = false }: HeroProps) {
  const style = { '--tilt': `${tilt}deg`, '--lift': `${lift}px` } as CSSProperties
  return (
    <div style={style} className={`playing-card relative -mx-1 ${front ? 'z-10' : ''}`}>
      <SpanishCard card={card} size="xl" />
    </div>
  )
}

export function CardBack({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block back-pattern ${className}`} />
}
