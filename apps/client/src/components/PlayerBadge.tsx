import { useMessages } from '../i18n/messages'

interface Props {
  name: string
  tricks: number
  points: number
  dealer: boolean
  active: boolean
  spotlight?: boolean
}

function badgeTone(active: boolean, spotlight: boolean): string {
  if (spotlight) return 'draw-spot border-gold'
  if (active) return 'turn-glow border-gold'
  return 'border-transparent'
}

export function PlayerBadge({ name, tricks, points, dealer, active, spotlight = false }: Props) {
  const t = useMessages()

  return (
    <div
      aria-current={active ? 'true' : undefined}
      data-spotlight={spotlight ? 'true' : undefined}
      className={`relative flex w-28 flex-col items-center whitespace-nowrap pixel-box border-2 bg-surface px-1 py-0.5 text-xs leading-tight ${
        badgeTone(active, spotlight)
      }`}
    >
      <span className="flex items-center gap-1 font-pixel text-lg leading-none">
        {name}
        {dealer && (
          <span title={t.dealer} className="text-gold">
            ●
          </span>
        )}
      </span>
      <span className="text-muted">{t.tricksWon(tricks)}</span>
      <span key={points} className="score-pop inline-block text-ink">
        {t.pointsShort(points)}
      </span>
    </div>
  )
}
