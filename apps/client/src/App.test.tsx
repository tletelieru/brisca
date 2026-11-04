import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  it('switches language', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }))
    await userEvent.click(screen.getByRole('button', { name: 'ES' }))
    expect(screen.getByText("El juego de bazas con triunfo y naipe español, contra bots.")).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByText("The Spanish-deck trick game with a trump suit, against bots.")).toBeTruthy()
  })

  it('toggles dark mode', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }))
    await userEvent.click(screen.getByRole('button', { name: /dark mode|modo oscuro/i }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('color-mode')).toBe('dark')
  })

  it('opens settings as a modal and closes it from outside', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    await userEvent.click(screen.getByTestId('overlay-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the rules from the start screen and from settings', async () => {
    localStorage.setItem('preferred-lang', 'en')
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Rules' }))
    const rules = screen.getByRole('dialog', { name: 'Rules' })
    await userEvent.click(within(rules).getByRole('button', { name: "Tricks" }))
    expect(screen.getByText('If you have the suit led, you must play it.')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    const settings = screen.getByRole('dialog', { name: 'Settings' })
    await userEvent.click(within(settings).getByRole('button', { name: 'Rules' }))
    expect(screen.getByRole('dialog', { name: 'Rules' })).toBeTruthy()
  })

  it('switches to the plain font', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }))
    await userEvent.click(screen.getByRole('checkbox', { name: /plain font|letra normal/i }))
    expect(document.documentElement.classList.contains('plain-font')).toBe(true)
    expect(localStorage.getItem('plain-font')).toBe('on')
  })

  it('scales the text and turns animations off', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /settings|ajustes/i }))
    await userEvent.click(screen.getByRole('button', { name: /extra large|muy grande/i }))
    expect(document.documentElement.style.fontSize).toBe('130%')
    await userEvent.click(screen.getByRole('checkbox', { name: /animations|animaciones/i }))
    expect(document.documentElement.classList.contains('reduce-motion')).toBe(true)
  })

  it('illustrates the rules with cards on every tab', async () => {
    localStorage.setItem('preferred-lang', 'en')
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Rules' }))
    const rules = screen.getByRole('dialog', { name: 'Rules' })
    for (const tab of ['Basics', 'Tricks', 'Points']) {
      await userEvent.click(within(rules).getByRole('button', { name: tab }))
      expect(rules.querySelectorAll('li .card-face').length).toBeGreaterThan(0)
    }
    expect(rules.querySelectorAll('li .card-face')).toHaveLength(10)
    expect(within(rules).getByText('40', { selector: 'figcaption' })).toBeTruthy()
  })

  it('turns music and sound effects off from settings', async () => {
    localStorage.setItem('preferred-lang', 'en')
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    await userEvent.click(screen.getByRole('checkbox', { name: /^Music/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /^Sound effects/ }))
    expect(localStorage.getItem('music')).toBe('off')
    expect(localStorage.getItem('sounds')).toBe('off')
  })

  it('drops a saved match from the old rules and old history entries', async () => {
    localStorage.setItem('preferred-lang', 'en')
    localStorage.setItem(
      'saved-match',
      JSON.stringify({
        state: { players: 2, hands: [[], []], trump: { suit: 'oros', rank: 1 }, stock: [], tricks: [], current: [] },
        seed: 1,
        level: 'easy',
      }),
    )
    const record = { finishedAt: 1, level: 'easy', trump: { suit: 'oros', rank: 1 }, tricks: [1, 1], winners: [0] }
    localStorage.setItem(
      'match-history',
      JSON.stringify([
        { ...record, id: 1, players: 2, points: [70, 50] },
        { ...record, id: 2, players: 4, points: [70, 50] },
        { ...record, id: 3, players: 3, points: [40, 30, 20], tricks: [5, 4, 4] },
      ]),
    )
    render(<App />)
    expect(screen.getByRole('button', { name: '3 players' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByText(/^1 played/)).toBeTruthy()
  })

  it('links the other games from the side column', () => {
    localStorage.setItem('preferred-lang', 'en')
    render(<App />)
    const others = screen.getByRole('complementary', { name: 'Other games' })
    const links = within(others).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://tletelieru.github.io/7-de-trebol/',
      'https://tletelieru.github.io/escoba/',
      'https://tletelieru.github.io/uno/',
      'https://tletelieru.github.io/tele/',
      'https://tletelieru.github.io/carioca/',
    ])
    expect(within(others).queryByRole('link', { name: /Brisca/ })).toBeNull()
  })

  it('opens the other games from the header', async () => {
    localStorage.setItem('preferred-lang', 'en')
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Other games' }))
    const dialog = screen.getByRole('dialog', { name: 'Other games' })
    const links = within(dialog).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://tletelieru.github.io/7-de-trebol/',
      'https://tletelieru.github.io/escoba/',
      'https://tletelieru.github.io/uno/',
      'https://tletelieru.github.io/tele/',
      'https://tletelieru.github.io/carioca/',
    ])
    expect(within(dialog).queryByRole('link', { name: /Brisca/ })).toBeNull()
  })

  it('hides the other games from settings', async () => {
    localStorage.setItem('preferred-lang', 'en')
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    await userEvent.click(screen.getByRole('checkbox', { name: /^Show other games/ }))
    expect(localStorage.getItem('other-games')).toBe('off')
    expect(screen.queryByRole('complementary', { name: 'Other games' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Other games' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Show other games' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('toggles the side column from the header in sync with settings', async () => {
    localStorage.setItem('preferred-lang', 'en')
    render(<App />)
    const hide = screen.getByRole('button', { name: 'Hide other games' })
    expect(hide.getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(hide)
    expect(screen.queryByRole('complementary', { name: 'Other games' })).toBeNull()
    expect(localStorage.getItem('other-games')).toBe('off')
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    const setting = screen.getByRole('checkbox', { name: /^Show other games/ })
    expect((setting as HTMLInputElement).checked).toBe(false)
    await userEvent.click(setting)
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('complementary', { name: 'Other games' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Hide other games' }).getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'Hide other games' }))
    await userEvent.click(screen.getByRole('button', { name: 'Show other games' }))
    expect(screen.getByRole('complementary', { name: 'Other games' })).toBeTruthy()
    expect(localStorage.getItem('other-games')).toBe('on')
  })
})
