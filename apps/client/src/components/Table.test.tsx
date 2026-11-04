import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { applyAction, createMatch, handSize, legalActions, sameCard, trickPoints } from '@brisca/engine'
import type { MatchState } from '@brisca/engine'
import { dealHoldMs, dealTotal, landTime, trumpTime } from '../lib/deal'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

function button(name: string) {
  return screen.queryByRole('button', { name })
}

function hand() {
  return screen.getByRole('region', { name: 'Your hand' })
}

function takeTurn() {
  const card = hand().querySelector('[data-card][aria-disabled="false"]')
  if (card) {
    fireEvent.click(card)
    fireEvent.click(card)
    return
  }
  act(() => {
    vi.advanceTimersByTime(700)
  })
}

function start(label: string) {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: label }))
}

function finishDraw() {
  act(() => {
    vi.advanceTimersByTime(2900)
  })
}

function finishDeal() {
  finishDraw()
  act(() => {
    vi.advanceTimersByTime(dealHoldMs(4) + 100)
  })
}

function savedDealer(): number {
  return JSON.parse(localStorage.getItem('saved-match')!).state.dealer
}

function trumpLabel() {
  return screen.getByRole('button', { name: /^Trump:/ }).getAttribute('aria-label')
}

function legalCards(state: MatchState) {
  return legalActions(state, 0).filter(
    (action, index, all) => all.findIndex((other) => sameCard(other.card, action.card)) === index,
  )
}

function humanFacing(seed: number, check: (state: MatchState) => boolean): MatchState {
  let state = createMatch({ players: 3 }, seed)
  while (state.status === 'playing') {
    if (state.turn === 0 && check(state)) return state
    state = applyAction(state, legalActions(state, state.turn)[0])
  }
  throw new Error('No matching position')
}

function restore(state: MatchState, seed: number) {
  localStorage.setItem('saved-match', JSON.stringify({ state, seed, level: 'easy' }))
  render(<App />)
}

describe('Table', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    localStorage.setItem('preferred-lang', 'en')
    localStorage.setItem('bot-level', 'easy')
    document.documentElement.className = ''
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it.each([
    ['3 players', 13],
    ['4 players', 10],
  ])('deals the whole deck and turns up the trump with %s', (label, size) => {
    start(label)
    finishDeal()
    expect(hand().querySelectorAll('[data-card]')).toHaveLength(size)
    expect(trumpLabel()).toMatch(/^Trump: (Oros|Copas|Espadas|Bastos)\./)
    const turnedInHand = hand().querySelectorAll('[aria-label$="Trump card"]').length
    const turnedOnBot = document.querySelectorAll('[data-turned]').length
    expect(turnedInHand + turnedOnBot).toBe(1)
    expect(trumpLabel()).toMatch(savedDealer() === 0 ? /In your hand$/ : /In Bot \d's hand$/)
  })

  it('needs two taps to play a card', () => {
    start('3 players')
    finishDeal()
    for (let step = 0; step < 4 && !hand().querySelector('[aria-disabled="false"]'); step++) {
      takeTurn()
    }
    const card = hand().querySelector('[data-card][aria-disabled="false"]')!
    const key = card.getAttribute('data-card')
    fireEvent.click(card)
    expect(screen.getByText('Tap it again to play it.')).toBeTruthy()
    expect(hand().querySelector(`[data-card="${key}"]`)).not.toBeNull()
    fireEvent.click(card)
    expect(hand().querySelector(`[data-card="${key}"]`)).toBeNull()
  })

  it('shows illegal cards disabled and explains why when tapped', () => {
    const state = humanFacing(4, (spot) => spot.current.length > 0 && legalCards(spot).length < spot.hands[0].length)
    restore(state, 4)
    expect(hand().querySelectorAll('[data-card]')).toHaveLength(state.hands[0].length)
    expect(hand().querySelectorAll('[data-card][aria-disabled="false"]')).toHaveLength(legalCards(state).length)
    const blocked = hand().querySelector('[data-card][aria-disabled="true"]')!
    expect(blocked.className).toContain('is-dimmed')
    fireEvent.click(blocked)
    expect(screen.getByText(/^(You must|You have no)/)).toBeTruthy()
    expect(hand().querySelectorAll('[data-card]')).toHaveLength(state.hands[0].length)
  })

  it('offers a knock for a king and knight of the same suit and announces the canto', () => {
    let found: { state: MatchState; seed: number } | null = null
    for (let seed = 1; seed < 80 && !found; seed++) {
      try {
        const state = humanFacing(seed, (spot) => spot.current.length > 0 && legalActions(spot, 0).some((action) => action.golpe))
        found = { state, seed }
      } catch {
        found = null
      }
    }
    const { state, seed } = found!
    restore(state, seed)
    const action = legalActions(state, 0).find((option) => option.golpe)!
    const card = hand().querySelector(`[data-card="${action.card.suit}-${action.card.rank}"]`)!
    expect(button('Knock')?.hasAttribute('disabled')).toBe(true)
    fireEvent.click(card)
    const value = action.card.suit === state.trump.suit ? 40 : 20
    expect(screen.getByText('Knock to sing, or tap it again to play it without singing.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: `Knock (${value})` }))
    expect(screen.getByText(`You: ${value}!`)).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('saved-match')!).state.cantos).toEqual([
      { seat: 0, suit: action.card.suit, points: value, trick: state.tricks.length, card: action.card },
    ])
  })

  it('takes one card from your hand per trick', () => {
    const state = humanFacing(6, (spot) => spot.current.length === 0)
    restore(state, 6)
    act(() => {
      vi.advanceTimersByTime(1300)
    })
    const card = hand().querySelector('[data-card][aria-disabled="false"]')!
    fireEvent.click(card)
    fireEvent.click(card)
    expect(hand().querySelectorAll('[data-card]')).toHaveLength(state.hands[0].length - 1)
  })

  it('opens the panel with the tricks you took', () => {
    start('4 players')
    fireEvent.click(screen.getByRole('button', { name: 'My tricks (0)' }))
    expect(screen.getByText('You have not taken any tricks yet.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('You have not taken any tricks yet.')).toBeNull()
  })

  it('lists only your own bazas, with points and total', () => {
    let state = createMatch({ players: 4 }, 21)
    while (
      state.tricks.length < 6 ||
      !state.tricks.some((trick) => trick.winner === 0) ||
      !state.tricks.some((trick) => trick.winner !== 0) ||
      state.current.length > 0
    ) {
      state = applyAction(state, legalActions(state, state.turn)[0])
    }
    restore(state, 21)
    const mine = state.tricks.filter((trick) => trick.winner === 0)
    const total = mine.reduce((sum, trick) => sum + trickPoints(trick), 0)
    fireEvent.click(screen.getByRole('button', { name: `My tricks (${mine.length})` }))
    const dialog = screen.getByRole('dialog', { name: `My tricks (${mine.length})` })
    expect(dialog.querySelectorAll('li')).toHaveLength(mine.length)
    const rows = [...dialog.querySelectorAll('li')].map((item) => item.textContent)
    mine.forEach((trick, index) => expect(rows[index]).toContain(`${trickPoints(trick)} pts`))
    expect(within(dialog).getByText(`Total in ${mine.length} ${mine.length === 1 ? 'trick' : 'tricks'}`)).toBeTruthy()
    expect(within(dialog).getByText(`${total} pts`, { selector: '.font-pixel' })).toBeTruthy()
  })

  it('scores every player on their own with 4 players', () => {
    start('4 players')
    expect(screen.queryByText(/Partner/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Score' }))
    const dialog = screen.getByRole('dialog', { name: 'Score' })
    for (const name of ['You', 'Bot 1', 'Bot 2', 'Bot 3']) {
      expect(within(dialog).getByText(name)).toBeTruthy()
    }
    expect(within(dialog).getByText('Match in progress. 10 tricks left to play.')).toBeTruthy()
  })

  it('asks before leaving a match', () => {
    start('3 players')
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep playing' }))
    expect(hand()).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, exit' }))
    expect(screen.getByRole('button', { name: '3 players' })).toBeTruthy()
  })

  it('keeps an abandoned match in the history once a card was played', () => {
    start('4 players')
    finishDeal()
    for (let step = 0; step < 6; step++) takeTurn()
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByText('Abandoned')).toBeTruthy()
  })

  it('skips the history when nothing was played', () => {
    start('4 players')
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, exit' }))
    expect(localStorage.getItem('match-history')).toBeNull()
  })

  it('comes back to the match after a reload', () => {
    start('3 players')
    finishDeal()
    for (let step = 0; step < 6; step++) takeTurn()
    const cards = () =>
      [...hand().querySelectorAll('[data-card]')].map((card) => card.getAttribute('data-card')).sort()
    const before = cards()
    const trump = trumpLabel()
    cleanup()
    render(<App />)
    expect(screen.queryByText(/^Dealer:/)).toBeNull()
    expect(document.querySelectorAll('[data-spotlight]')).toHaveLength(0)
    expect(cards()).toEqual(before)
    expect(trumpLabel()).toBe(trump)
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, exit' }))
    expect(localStorage.getItem('saved-match')).toBeNull()
  })

  it('shows the score of the match in progress', () => {
    start('3 players')
    fireEvent.click(screen.getByRole('button', { name: 'Score' }))
    expect(screen.getByRole('dialog', { name: 'Score' })).toBeTruthy()
    expect(screen.getByText(/Match in progress/)).toBeTruthy()
  })

  it('drops the deal animation once the deal ends', () => {
    start('3 players')
    finishDraw()
    act(() => {
      vi.advanceTimersByTime(landTime(dealTotal(3) - 1, 3))
    })
    expect(hand().querySelector('.deal-land')).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(dealHoldMs(3))
    })
    expect(hand().querySelector('.deal-land')).toBeNull()
  })

  it('starts with an empty table and deals every card in packets before the trump', () => {
    start('4 players')
    const botCards = () => document.querySelectorAll('.fan-card').length
    const myCards = () => hand().querySelectorAll('[data-card]').length
    const trump = () => screen.queryByRole('button', { name: /^Trump:/ })
    expect([botCards(), myCards()]).toEqual([0, 0])
    expect(trump()).toBeNull()
    finishDraw()
    expect([botCards(), myCards()]).toEqual([0, 0])
    const seen: number[] = []
    for (let at = 100; at < landTime(39, 4); at += 100) {
      act(() => {
        vi.advanceTimersByTime(100)
      })
      seen.push(botCards() + myCards())
      expect(trump()).toBeNull()
    }
    expect(seen.some((count) => count > 0 && count < 40)).toBe(true)
    seen.slice(1).forEach((count, index) => expect(count).toBeGreaterThanOrEqual(seen[index]))
    act(() => {
      vi.advanceTimersByTime(trumpTime(4) - landTime(39, 4) + 100)
    })
    expect(botCards() + myCards()).toBe(40)
    expect(trump()).not.toBeNull()
  })

  it('shows the dealt table right away with animations off', () => {
    localStorage.setItem('reduce-motion', 'on')
    start('3 players')
    act(() => {
      vi.advanceTimersByTime(900)
    })
    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(hand().querySelectorAll('[data-card]')).toHaveLength(13)
    expect(screen.getByRole('button', { name: /^Trump:/ })).toBeTruthy()
  })

  it.each(['3 players', '4 players'])(
    'draws who deals before dealing with %s',
    (label) => {
      start(label)
      const dealer = savedDealer()
      const name = dealer === 0 ? 'You' : `Bot ${dealer}`
      expect(hand().querySelectorAll('[data-card]')).toHaveLength(0)
      expect(screen.queryByText(/^Dealer:/)).toBeNull()
      act(() => {
        vi.advanceTimersByTime(50)
      })
      expect(document.querySelectorAll('[data-spotlight]')).toHaveLength(1)
      act(() => {
        vi.advanceTimersByTime(1960)
      })
      expect(screen.getByText(`Dealer: ${name}`)).toBeTruthy()
      expect(document.querySelector('[data-spotlight]')!.textContent).toContain(name)
      expect(document.querySelectorAll('[data-play]')).toHaveLength(0)
      expect(hand().querySelectorAll('[data-card]')).toHaveLength(0)
      act(() => {
        vi.advanceTimersByTime(900)
      })
      expect(screen.queryByText(/^Dealer:/)).toBeNull()
      expect(document.querySelectorAll('[data-spotlight]')).toHaveLength(0)
      act(() => {
        vi.advanceTimersByTime(dealHoldMs(4) + 100)
      })
      expect(hand().querySelectorAll('[data-card]')).toHaveLength(handSize(label === '3 players' ? 3 : 4))
    },
  )

  it('shows who deals right away with animations off', () => {
    localStorage.setItem('reduce-motion', 'on')
    start('3 players')
    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(screen.getByText(/^Dealer: /)).toBeTruthy()
  })

  it('keeps the bots waiting until the draw ends', () => {
    start('4 players')
    act(() => {
      vi.advanceTimersByTime(2800)
    })
    expect(document.querySelectorAll('[data-play]')).toHaveLength(0)
  })

  it.each([
    ['easy', '3 players'],
    ['medium', '3 players'],
    ['hard', '4 players'],
    ['easy', '4 players'],
  ])('plays a whole %s match with %s', { timeout: 120000 }, (level, label) => {
    localStorage.setItem('bot-level', level)
    start(label)
    let guard = 0
    while (!screen.queryByText('Match finished') && guard < 2000) {
      takeTurn()
      guard += 1
    }
    expect(screen.getByText('Match finished')).toBeTruthy()
    expect(screen.getByText(/^(You won!|You lost|Tie)$/)).toBeTruthy()
    const panels = [...document.querySelectorAll('[data-side]')]
    expect(panels).toHaveLength(Number(label[0]))
    const total = panels.reduce((sum, panel) => sum + Number(panel.querySelector('.text-2xl')!.textContent), 0)
    expect(total).toBeGreaterThanOrEqual(90)
    expect(panels.some((panel) => /Aces|Threes/.test(panel.textContent ?? ''))).toBe(true)
    expect(panels.filter((panel) => /Last trick 10/.test(panel.textContent ?? ''))).toHaveLength(1)
    expect(document.querySelectorAll('[data-side] .card-face').length).toBeGreaterThan(0)
    expect(hand().querySelectorAll('[data-card]')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Back to start' }))
    fireEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByText(/^1 played/)).toBeTruthy()
    expect(localStorage.getItem('saved-match')).toBeNull()
  })

  it.each([
    ['easy', 1],
    ['medium', 0],
    ['hard', 0],
  ])('marks the card winning the trick only on %s', (level, marked) => {
    localStorage.setItem('bot-level', level)
    start('3 players')
    finishDeal()
    const plays = () => document.querySelectorAll('[data-play]')
    for (let step = 0; step < 6 && plays().length === 0; step++) {
      act(() => {
        vi.advanceTimersByTime(700)
      })
      if (plays().length === 0) takeTurn()
    }
    expect(plays().length).toBeGreaterThan(0)
    expect(document.querySelectorAll('[data-play] .border-gold')).toHaveLength(marked)
  })

  it('starts from Home with the chosen difficulty', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Hard' }))
    expect(localStorage.getItem('bot-level')).toBe('hard')
    expect(button('Hard')?.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '3 players' }))
    expect(JSON.parse(localStorage.getItem('saved-match')!).level).toBe('hard')
  })
})
