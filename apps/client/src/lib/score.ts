import type { Breakdown } from '@brisca/engine'
import type { Messages } from '../i18n/messages'

export function breakdownLine(t: Messages, entry: Breakdown, monos: number | null): string {
  const parts = [
    { label: t.breakdown.aces, value: entry.aces },
    { label: t.breakdown.threes, value: entry.threes },
    { label: t.breakdown.cantos, value: entry.cantos },
    { label: t.breakdown.last, value: entry.last },
  ]
    .filter((part) => part.value > 0)
    .map((part) => `${part.label} ${part.value}`)
  const text = parts.length > 0 ? parts.join(' · ') : t.breakdown.none
  return monos === null ? text : `${text} · ${t.breakdown.monos} ${monos}`
}
