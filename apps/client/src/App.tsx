import { useEffect, useLayoutEffect, useState } from 'react'
import type { Level } from '@brisca/bots'
import type { MatchState, PlayerCount } from '@brisca/engine'
import { useInstall } from './useInstall'
import { pickLocale, preferredLocaleKey } from './i18n/locales'
import type { Locale } from './i18n/locales'
import { LocaleContext } from './i18n/messages'
import {
  levelKey,
  plainFontKey,
  readLevel,
  readPlainFont,
  readReduceMotion,
  reduceMotionKey,
  readSounds,
  soundsKey,
  musicKey,
  readMusic,
} from './lib/settings'
import { readSavedMatch } from './lib/savedMatch'
import { createMusic } from './lib/music'
import { MusicContext, SETUP_TRACKS, SfxContext, createSfx, trackForMatch } from './lib/sound'
import { pickTextSize, textSizeKey, textSizeScale } from './lib/textSize'
import type { TextSize } from './lib/textSize'
import { colorModeKey, pickColorMode, prefersDark } from './lib/theme'
import type { ColorMode } from './lib/theme'
import { Footer } from './components/Footer'
import { OtherGamesAside, OtherGamesDialog } from './components/OtherGames'
import { otherGamesKey, readOtherGames } from './lib/otherGames'
import { Header } from './components/Header'
import { History } from './components/History'
import { Home } from './components/Home'
import { Rules } from './components/Rules'
import { Settings } from './components/Settings'
import { Table } from './components/Table'

interface Session {
  players: PlayerCount
  seed: number
  level: Level
  restored: MatchState | null
}

function restoreSession(): Session | null {
  const saved = readSavedMatch()
  if (!saved) return null
  const { state, seed, level } = saved
  return { players: state.players, seed, level, restored: state }
}

export default function App() {
  const install = useInstall()
  const [locale, setLocale] = useState<Locale>(() =>
    pickLocale(localStorage.getItem(preferredLocaleKey), navigator.languages),
  )
  const [mode, setMode] = useState<ColorMode>(() =>
    pickColorMode(localStorage.getItem(colorModeKey), prefersDark()),
  )
  const [session, setSession] = useState<Session | null>(restoreSession)
  const [level, setLevel] = useState<Level>(readLevel)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [otherGamesOn, setOtherGamesOn] = useState(readOtherGames)
  const [otherGamesOpen, setOtherGamesOpen] = useState(false)
  const showOtherGames = (next: boolean) => {
    localStorage.setItem(otherGamesKey, next ? 'on' : 'off')
    setOtherGamesOn(next)
  }
  const [rulesOpen, setRulesOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(readReduceMotion)
  const [plainFont, setPlainFont] = useState(readPlainFont)
  const [soundsOn, setSoundsOn] = useState(readSounds)
  const [sfx] = useState(createSfx)
  const [musicOn, setMusicOn] = useState(readMusic)
  const [music] = useState(() => createMusic(trackForMatch(session?.restored ?? null)))
  const [textSize, setTextSize] = useState<TextSize>(() =>
    pickTextSize(localStorage.getItem(textSizeKey)),
  )

  // eslint-disable-next-line local/no-effect -- applies settings to <html>, which lives outside the React root
  useLayoutEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.classList.toggle('dark', mode === 'dark')
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    document.documentElement.classList.toggle('plain-font', plainFont)
    document.documentElement.style.colorScheme = mode
    document.documentElement.style.fontSize = textSizeScale[textSize]
  }, [locale, mode, reduceMotion, plainFont, textSize])

  // eslint-disable-next-line local/no-effect -- starts and pauses the Web Audio context with page visibility and the first user gesture
  useEffect(() => {
    if (!music || !musicOn) return
    const sync = () => {
      if (document.hidden) music.pause()
      else music.play()
    }
    window.addEventListener('pointerdown', sync, { once: true })
    document.addEventListener('visibilitychange', sync)
    if (navigator.userActivation?.hasBeenActive) sync()
    return () => {
      window.removeEventListener('pointerdown', sync)
      document.removeEventListener('visibilitychange', sync)
      music.pause()
    }
  }, [music, musicOn])

  return (
    <LocaleContext value={locale}>
      <MusicContext value={music}>
      <SfxContext value={soundsOn ? sfx : null}>
      <div
        className={`mx-auto flex max-w-lg flex-col gap-3 p-4 ${
          session ? 'h-dvh overflow-hidden' : 'relative min-h-dvh'
        }`}
      >
        <Header
          otherGames={
            session
              ? null
              : {
                  on: otherGamesOn,
                  onOpen: () => setOtherGamesOpen(true),
                  onToggle: () => showOtherGames(!otherGamesOn),
                }
          }
          textSize={textSize}
          onInstall={install}
          settingsOpen={settingsOpen}
          onSettings={() => setSettingsOpen(true)}
        />
        {settingsOpen && (
          <Settings
            otherGames={otherGamesOn}
            onOtherGames={showOtherGames}
            mode={mode}
            onToggleMode={() => {
              const next = mode === 'dark' ? 'light' : 'dark'
              localStorage.setItem(colorModeKey, next)
              setMode(next)
            }}
            onLocale={(next) => {
              localStorage.setItem(preferredLocaleKey, next)
              setLocale(next)
            }}
            textSize={textSize}
            onTextSize={(next) => {
              localStorage.setItem(textSizeKey, next)
              setTextSize(next)
            }}
            reduceMotion={reduceMotion}
            onReduceMotion={(next) => {
              localStorage.setItem(reduceMotionKey, next ? 'on' : 'off')
              setReduceMotion(next)
            }}
            plainFont={plainFont}
            onPlainFont={(next) => {
              localStorage.setItem(plainFontKey, next ? 'on' : 'off')
              setPlainFont(next)
            }}
            musicOn={musicOn}
            onMusic={(next) => {
              localStorage.setItem(musicKey, next ? 'on' : 'off')
              setMusicOn(next)
            }}
            sounds={soundsOn}
            onSounds={(next) => {
              localStorage.setItem(soundsKey, next ? 'on' : 'off')
              setSoundsOn(next)
            }}
            onRules={() => {
              setSettingsOpen(false)
              setRulesOpen(true)
            }}
            onClose={() => setSettingsOpen(false)}
          />
        )}
        {rulesOpen && <Rules onClose={() => setRulesOpen(false)} />}
        {historyOpen && <History onClose={() => setHistoryOpen(false)} />}
        {session ? (
          <Table
            key={session.seed}
            players={session.players}
            seed={session.seed}
            level={session.level}
            restored={session.restored}
            onExit={() => {
              music?.setTrack(SETUP_TRACKS.home)
              setSession(null)
            }}
          />
        ) : (
          <>
            <Home
              level={level}
              onLevel={(next) => {
                localStorage.setItem(levelKey, next)
                setLevel(next)
              }}
              onRules={() => setRulesOpen(true)}
              onHistory={() => setHistoryOpen(true)}
              onStart={(players) => {
                music?.setTrack(SETUP_TRACKS.match)
                setSession({ players, seed: Date.now() | 0, level, restored: null })
              }}
            />
            {otherGamesOn && <OtherGamesAside textSize={textSize} />}
            {otherGamesOpen && <OtherGamesDialog onClose={() => setOtherGamesOpen(false)} />}
            <Footer />
          </>
        )}
      </div>
      </SfxContext>
      </MusicContext>
    </LocaleContext>
  )
}
