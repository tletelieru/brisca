import type { Card } from '@brisca/engine'
import { SpanishCard } from './SpanishCard'
import type { CardSize } from './SpanishCard'

interface Props {
  card: Card
  highlight?: boolean
  marked?: boolean
  size?: CardSize
}

export function FlipCard({ card, highlight = false, marked = false, size = 'md' }: Props) {
  return (
    <div className="card-flip">
      <div className="flip-face">
        <SpanishCard card={card} size={size} highlight={highlight} marked={marked} />
      </div>
      <span className="flip-back back-pattern" />
    </div>
  )
}
