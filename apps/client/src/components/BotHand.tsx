import type { Card } from '@brisca/engine'
import { SUIT_ON_CARD, rankLabel } from '../lib/cards'
import { SpanishSuitIcon } from './SpanishSuitIcon'

const CARD_LONG = 1.875
const CARD_SHORT = 1.25
const MAX_SPACING = 0.75
const LINE_REM = { horizontal: 18, vertical: 9 }

interface Props {
  cards: number
  active: boolean
  vertical?: boolean
  turned?: Card | null
}

export function BotHand({ cards, active, vertical = false, turned = null }: Props) {
  const room = (vertical ? LINE_REM.vertical : LINE_REM.horizontal) - CARD_SHORT
  const spacing = Math.min(cards > 1 ? room / (cards - 1) : 0, MAX_SPACING)
  const overlap = `${spacing - CARD_SHORT}rem`
  const faceUp = turned && cards > 0 ? cards - 1 : -1

  return (
    <div
      aria-hidden="true"
      className={`fan-in flex shrink-0 items-center justify-center ${vertical ? 'h-36' : 'h-8'}`}
    >
      <div
        className={`flex items-center justify-center ${vertical ? 'flex-col' : ''} ${
          active ? 'fan-active' : ''
        }`}
      >
        {Array.from({ length: cards }, (_, index) => {
          const style = {
            width: `${vertical ? CARD_LONG : CARD_SHORT}rem`,
            height: `${vertical ? CARD_SHORT : CARD_LONG}rem`,
            ...(index > 0 && (vertical ? { marginTop: overlap } : { marginLeft: overlap })),
          }
          if (turned && index === faceUp) {
            return (
              <span
                key={index}
                data-turned="true"
                style={style}
                className={`fan-card card-face card-trump flex items-center justify-center gap-px font-pixel text-xs leading-none ${
                  vertical ? 'flex-row' : 'flex-col'
                } ${SUIT_ON_CARD[turned.suit]}`}
              >
                {rankLabel(turned.rank)}
                <SpanishSuitIcon suit={turned.suit} className="size-2.5" />
              </span>
            )
          }
          return <span key={index} style={style} className="fan-card back-pattern" />
        })}
      </div>
    </div>
  )
}
