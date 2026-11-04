import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { cantoPoints, sameCard } from '@brisca/engine'
import type { Action, Card, PlayRule, Suit } from '@brisca/engine'
import { useMessages } from '../i18n/messages'
import { cardKey, moveItem, sortHand } from '../lib/cards'
import { SpanishCard } from './SpanishCard'

interface Props {
  header: ReactNode
  hand: Card[]
  trump: Card
  turned: boolean
  legal: Action[]
  rule: PlayRule
  lead: Suit | null
  dealing: boolean
  visible: number
  notice: string | null
  onPlay: (card: Card, golpe: boolean) => void
}

interface Drag {
  key: string
  element: HTMLButtonElement
  startX: number
  startY: number
  grabX: number
  grabY: number
  x: number
  y: number
  moved: boolean
}

const SINGLE_ROW = 6
const DRAG_THRESHOLD = 6

function handKeys(hand: Card[]): string {
  return hand.map(cardKey).join(',')
}

function layout(count: number) {
  const top = count <= SINGLE_ROW ? count : Math.ceil(count / 2)
  const columns = Math.max(2, top * 2)
  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${columns - 2}, minmax(0, 2.125rem)) 2rem 2rem`,
    gridTemplateRows: count > top ? '4.5rem 6rem' : '6rem',
  }
  const offset = 1 + top - (count - top)
  const cell = (index: number): CSSProperties => {
    const second = index >= top
    const slot = second ? index - top : index
    const start = second ? offset + slot * 2 : 1 + slot * 2
    return { gridRow: second ? 2 : 1, gridColumn: `${start} / span 2` }
  }
  return { style, cell }
}

function syncOrder(order: string[], sorted: string[]): string[] {
  const keys = new Set(sorted)
  const kept = order.filter((key) => keys.has(key))
  const known = new Set(kept)
  return [...kept, ...sorted.filter((key) => !known.has(key))]
}

function isReducedMotion(): boolean {
  return document.documentElement.classList.contains('reduce-motion')
}

export function Hand({ header, hand, trump, turned, legal, rule, lead, dealing, visible, notice, onPlay }: Props) {
  const t = useMessages()
  const [selected, setSelected] = useState<Card | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [custom, setCustom] = useState<string[] | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [known, setKnown] = useState(() => handKeys(hand))
  const grid = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const dragged = useRef(false)
  const slots = useRef(new Map<string, { left: number; top: number }>())
  const keys = handKeys(hand)
  if (keys !== known) {
    setKnown(keys)
    setHint(null)
  }

  const sortedKeys = sortHand(hand, trump.suit).map(cardKey)
  const order = custom ? syncOrder(custom, sortedKeys) : sortedKeys
  const orderKey = order.join(',')
  const isSorted = order.every((key, index) => key === sortedKeys[index])
  const dealt = new Set(hand.slice(0, visible).map(cardKey))
  const shown = order
    .filter((key) => dealt.has(key))
    .flatMap((key) => hand.filter((card) => cardKey(card) === key))
  const cells = layout(shown.length)

  const myTurn = legal.length > 0
  const isLegal = (card: Card) => legal.some((action) => sameCard(action.card, card))
  const sings = (card: Card) => legal.some((action) => action.golpe && sameCard(action.card, card))
  const knock = selected && sings(selected) ? cantoPoints(selected.suit, trump.suit) : null
  const prompt = () => {
    if (knock) return t.knockHint
    if (selected) return t.tapAgain
    return t.yourTurn
  }
  const status = notice ?? hint ?? prompt()
  const explain = () => {
    if (rule === 'free' || !lead) return null
    return t.mustPlay[rule](t.suits[lead], t.suits[trump.suit])
  }

  const place = useCallback(() => {
    const current = drag.current
    const box = grid.current?.getBoundingClientRect()
    if (!current?.moved || !box) return
    const x = current.x - current.grabX - box.left - current.element.offsetLeft
    const y = current.y - current.grabY - box.top - current.element.offsetTop
    current.element.style.translate = `${x}px ${y}px`
  }, [])

  // eslint-disable-next-line local/no-effect -- slides the cards in the DOM from their previous slots after a reorder
  useLayoutEffect(() => {
    place()
    const buttons = grid.current?.querySelectorAll<HTMLButtonElement>('[data-card]') ?? []
    const next = new Map<string, { left: number; top: number }>()
    buttons.forEach((button) => {
      const key = button.dataset.card!
      const slot = { left: button.offsetLeft, top: button.offsetTop }
      const previous = slots.current.get(key)
      next.set(key, slot)
      if (!previous || key === drag.current?.key || dealing || isReducedMotion()) return
      const x = previous.left - slot.left
      const y = previous.top - slot.top
      if (x === 0 && y === 0) return
      button.animate?.([{ translate: `${x}px ${y}px` }, { translate: '0 0' }], {
        duration: 160,
        easing: 'ease-out',
      })
    })
    slots.current = next
  }, [orderKey, shown.length, place, dealing])

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, key: string) => {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    element.setPointerCapture?.(event.pointerId)
    dragged.current = false
    drag.current = {
      key,
      element,
      startX: event.clientX,
      startY: event.clientY,
      grabX: event.clientX - rect.left,
      grabY: event.clientY - rect.top,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current) return
    current.x = event.clientX
    current.y = event.clientY
    if (!current.moved) {
      const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY)
      if (distance < DRAG_THRESHOLD) return
      current.moved = true
      setSelected(null)
      setDragging(current.key)
    }
    place()
    const box = grid.current?.getBoundingClientRect()
    if (!box) return
    const x = event.clientX - box.left
    const y = event.clientY - box.top
    const buttons = [...(grid.current?.querySelectorAll<HTMLButtonElement>('[data-card]') ?? [])]
    const tops = [...new Set(buttons.map((button) => button.offsetTop))].sort((a, b) => a - b)
    const rowTop = tops.filter((top) => top <= y).at(-1) ?? tops[0]
    const row = buttons
      .filter((button) => button.offsetTop === rowTop)
      .sort((a, b) => a.offsetLeft - b.offsetLeft)
    const index = Math.max(0, row.findLastIndex((button) => button.offsetLeft <= x))
    const target = row[index]
    if (!target || target.dataset.card === current.key) return
    const end = row[index + 1]?.offsetLeft ?? target.offsetLeft + target.offsetWidth
    const center = (target.offsetLeft + end) / 2
    const from = order.indexOf(current.key)
    const to = order.indexOf(target.dataset.card!)
    const sameRow = current.element.offsetTop === rowTop
    const crossed = !sameRow || (to > from ? x >= center : x <= center)
    if (crossed) setCustom(moveItem(order, from, to))
  }

  const onPointerEnd = () => {
    const current = drag.current
    drag.current = null
    if (!current?.moved) return
    dragged.current = true
    const landing = current.element.style.translate
    current.element.style.translate = ''
    setDragging(null)
    if (isReducedMotion()) return
    current.element.animate?.([{ translate: landing }, { translate: '0 0' }], {
      duration: 140,
      easing: 'ease-out',
    })
  }

  return (
    <section aria-label={t.yourHand} className="flex w-full flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {header}
        <button
          type="button"
          disabled={isSorted}
          onClick={() => setCustom(null)}
          className="pixel-box bg-raised px-2 py-1 text-xs font-medium disabled:opacity-50"
        >
          {t.sortHand}
        </button>
        <button
          type="button"
          disabled={knock === null}
          onClick={() => {
            if (!selected) return
            setSelected(null)
            onPlay(selected, true)
          }}
          className="min-w-24 pixel-button bg-gold px-3 py-1 font-pixel text-lg leading-none text-surface disabled:opacity-40"
        >
          {knock === null ? t.knockIdle : t.knock(knock)}
        </button>
      </div>
      <div className={`flex min-h-10 w-full items-center justify-center gap-2 ${myTurn || notice ? '' : 'invisible'}`}>
        <p
          aria-live="polite"
          className={`min-w-0 text-center text-sm leading-tight font-medium ${hint ? 'text-rose-700 dark:text-rose-400' : 'text-gold'}`}
        >
          {status}
        </p>
      </div>
      <div ref={grid} style={cells.style} className="relative grid h-42 w-full max-w-md justify-center px-1">
        {shown.map((card, position) => {
          const key = cardKey(card)
          const playable = isLegal(card)
          const picked = selected !== null && sameCard(selected, card)
          const isTurned = turned && sameCard(card, trump)
          const style = { ...cells.cell(position), '--delay': `${position * 30}ms` } as CSSProperties
          return (
            <button
              key={key}
              type="button"
              data-card={key}
              style={style}
              aria-disabled={!playable}
              aria-pressed={picked}
              aria-label={isTurned ? `${t.cardName(card)}. ${t.turnedCard}` : t.cardName(card)}
              onPointerDown={(event) => onPointerDown(event, key)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false
                  return
                }
                if (!myTurn) return
                if (!playable) {
                  setSelected(null)
                  return setHint(explain())
                }
                setHint(null)
                if (!picked) return setSelected(card)
                setSelected(null)
                onPlay(card, false)
              }}
              className={`hand-card relative block w-16 self-start text-left ${picked ? 'is-picked' : ''} ${
                myTurn && !playable ? 'is-dimmed' : ''
              } ${dragging === key ? 'is-dragging' : ''}`}
            >
              <span className={`block w-16 ${dealing ? 'deal-land' : ''}`}>
                <SpanishCard card={card} size="lg" highlight={picked} marked={card.suit === trump.suit} />
              </span>
              {sings(card) && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1 pixel-box bg-gold px-1 font-pixel text-sm leading-tight text-surface"
                >
                  {cantoPoints(card.suit, trump.suit)}
                </span>
              )}
              {isTurned && (
                <span
                  aria-hidden="true"
                  title={t.turnedCard}
                  className="absolute -top-1.5 -left-1 pixel-box bg-gold px-1 font-pixel text-sm leading-tight text-surface"
                >
                  ★
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
