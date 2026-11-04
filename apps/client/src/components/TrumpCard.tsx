import type { Card } from '@brisca/engine'
import { useMessages } from '../i18n/messages'
import { SUIT_ON_TABLE } from '../lib/cards'
import { SpanishCard } from './SpanishCard'
import { SpanishSuitIcon } from './SpanishSuitIcon'

interface Props {
  trump: Card
  revealed: boolean
  drawing: boolean
  held: boolean
  holder: string | null
  onClick: () => void
}

const BOX = 'flex min-w-0 flex-1 items-center gap-3 pixel-box bg-surface px-2 py-1.5 text-left'

export function TrumpCard({ trump, revealed, drawing, held, holder, onClick }: Props) {
  const t = useMessages()

  if (!revealed) {
    return (
      <button type="button" onClick={onClick} className={BOX}>
        <span aria-hidden="true" className="block h-11 w-7 shrink-0 border-2 border-dashed border-muted/50" />
        <span className="min-w-0 leading-tight">
          <span className="block font-pixel text-xl leading-none">{t.trump}</span>
          <span className="block truncate text-xs text-muted">
            {drawing ? t.drawingDealer : t.dealingCards}
          </span>
        </span>
      </button>
    )
  }

  const where = held ? t.trumpHeldBy(holder) : t.trumpPlayed

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${t.trump}: ${t.suits[trump.suit]}. ${t.cardName(trump)}. ${where}`}
      className={BOX}
    >
      <span aria-hidden="true" className={`trump-flip shrink-0 ${held ? '' : 'opacity-50'}`}>
        <SpanishCard card={trump} size="sm" marked />
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`flex items-center gap-1 font-pixel text-xl leading-none ${SUIT_ON_TABLE[trump.suit]}`}>
          <SpanishSuitIcon suit={trump.suit} className="size-4" />
          {t.trump}: {t.suits[trump.suit]}
        </span>
        <span className="block truncate text-xs text-muted">{where}</span>
      </span>
    </button>
  )
}
