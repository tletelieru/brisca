import { createContext, useContext } from 'react'
import type { Level } from '@brisca/bots'
import type { Card, PlayRule, Rank, Suit } from '@brisca/engine'
import type { TextSize } from '../lib/textSize'
import { defaultLocale } from './locales'
import type { Locale } from './locales'

type Outcome = 'won' | 'tied' | 'lost' | 'abandoned'

type ForcedRule = Exclude<PlayRule, 'free'>

export interface Messages {
  appName: string
  tagline: string
  history: string
  historyEmpty: string
  historySummary: (played: number, won: number) => string
  playerCount: (n: number) => string
  outcomes: Record<Outcome, string>
  rules: string
  difficulty: string
  levels: Record<Level, string>
  levelHints: Record<Level, string>
  playWith: (players: number) => string
  playMode: (players: number) => string
  pointsHint: string
  suits: Record<Suit, string>
  cardName: (card: Card) => string
  you: string
  bot: (n: number) => string
  yourHand: string
  yourTurn: string
  tapAgain: string
  trump: string
  trumpHeldBy: (name: string | null) => string
  trumpPlayed: string
  turnedCard: string
  mustPlay: Record<ForcedRule, (lead: string, trump: string) => string>
  dealer: string
  dealerIs: (name: string) => string
  breakdown: { aces: string; threes: string; cantos: string; last: string; monos: string; none: string }
  pointsRows: { label: string; detail: string; points: string }[]
  knock: (points: number) => string
  knockHint: string
  knockIdle: string
  sortHand: string
  cantoCall: (name: string, points: number) => string
  cantoOf: (name: string, points: number) => string
  tiebreakNote: string
  ruleLead: string
  ruleAnswer: string
  ruleRemoved: string
  ruleNotAllowed: string
  ruleBest: string
  ruleDealerKeeps: string
  drawingDealer: string
  dealingCards: string
  music: string
  musicHint: string
  sounds: string
  soundsHint: string
  tricksWon: (n: number) => string
  pointsShort: (n: number) => string
  exit: string
  exitTitle: string
  exitBody: string
  exitConfirm: string
  keepPlaying: string
  close: string
  scoreTitle: string
  liveScore: (tricksLeft: number) => string
  myTricks: (n: number) => string
  noTricks: string
  tricksTotal: (n: number) => string
  player: string
  tricksTitle: string
  pointsTitle: string
  matchFinished: string
  backHome: string
  youWon: string
  youLost: string
  tieResult: string
  settings: string
  textSize: string
  textSizes: Record<TextSize, string>
  plainFont: string
  plainFontHint: string
  reduceMotion: string
  reduceMotionHint: string
  toLight: string
  toDark: string
  language: string
  install: string
  developedBy: string
  otherGames: string
  showOtherGames: string
  hideOtherGames: string
  showOtherGamesHint: string
}

const SUITS: Record<Suit, string> = {
  oros: 'Oros',
  copas: 'Copas',
  espadas: 'Espadas',
  bastos: 'Bastos',
}

const EN_RANKS: Record<Rank, string> = {
  1: 'Ace',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  10: 'Jack',
  11: 'Knight',
  12: 'King',
}

const ES_RANKS: Record<Rank, string> = {
  1: 'As',
  2: 'Dos',
  3: 'Tres',
  4: 'Cuatro',
  5: 'Cinco',
  6: 'Seis',
  7: 'Siete',
  10: 'Sota',
  11: 'Caballo',
  12: 'Rey',
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export const messages: Record<Locale, Messages> = {
  en: {
    appName: 'Brisca',
    tagline: 'The Spanish-deck trick game with a trump suit, against bots.',
    history: 'History',
    historyEmpty: 'Finished matches will appear here.',
    historySummary: (played, won) => `${played} played · ${won} won`,
    playerCount: (n) => `${n} players`,
    outcomes: { won: 'You won', tied: 'Tie', lost: 'You lost', abandoned: 'Abandoned' },
    rules: 'Rules',
    difficulty: 'Difficulty',
    levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
    levelHints: {
      easy: 'bots with simple rules',
      medium: 'bots that think ahead',
      hard: 'bots that count cards',
    },
    playWith: (players) => `${players} players`,
    playMode: () => 'players',
    pointsHint: 'Every other card is worth 0. Most points wins; a tie goes to the monos count (Ace 1, King 4, Knight 3, Jack 2).',
    suits: SUITS,
    cardName: (card) => `${EN_RANKS[card.rank]} of ${SUITS[card.suit]}`,
    you: 'You',
    bot: (n) => `Bot ${n}`,
    yourHand: 'Your hand',
    yourTurn: 'Your turn. Tap a card twice to play it.',
    tapAgain: 'Tap it again to play it.',
    trump: 'Trump',
    trumpHeldBy: (name) => (name ? `In ${name}'s hand` : 'In your hand'),
    trumpPlayed: 'Already played',
    turnedCard: 'Trump card',
    mustPlay: {
      follow: (lead) => `You must follow suit: play a card of ${lead}.`,
      beat: (lead) => `You must beat the trick: play a higher card of ${lead}.`,
      trump: (lead, trump) => `You have no ${lead}: you must play a trump (${trump}).`,
      overtrump: (_lead, trump) => `You must play a higher trump (${trump}).`,
    },
    dealer: 'Dealer',
    dealerIs: (name) => `Dealer: ${name}`,
    breakdown: { aces: 'Aces', threes: 'Threes', cantos: 'Cantos', last: 'Last trick', monos: 'Monos', none: 'No points' },
    pointsRows: [
      { label: 'Ace', detail: 'each one you take', points: '10' },
      { label: 'Three', detail: 'each one you take', points: '10' },
      { label: 'Last trick', detail: 'whoever wins it', points: '10' },
      { label: 'King + Knight', detail: 'same suit, knock to sing', points: '20' },
      { label: 'King + Knight of trumps', detail: 'knock to sing', points: '40' },
    ],
    knock: (points) => `Knock (${points})`,
    knockHint: 'Knock to sing, or tap it again to play it without singing.',
    knockIdle: 'Knock',
    sortHand: 'Sort',
    cantoCall: (name, points) => `${name}: ${points}!`,
    cantoOf: (name, points) => `${name}'s canto · ${points}`,
    tiebreakNote: 'Tied on points: the monos decide.',
    ruleLead: 'Led',
    ruleAnswer: 'Allowed',
    ruleRemoved: 'Removed',
    ruleNotAllowed: 'Not allowed',
    ruleBest: 'Winning',
    ruleDealerKeeps: 'Last card: the dealer keeps it',
    drawingDealer: 'Drawing for dealer',
    dealingCards: 'Dealing',
    music: 'Music',
    musicHint: 'Chiptune tunes with a Spanish guitar feel, one for the start screen and one for the match.',
    sounds: 'Sound effects',
    soundsHint: 'Short sounds when cards are played, when the dealer is drawn and when the match ends.',
    tricksWon: (n) => plural(n, 'trick', 'tricks'),
    pointsShort: (n) => `${n} pts`,
    exit: 'Exit',
    exitTitle: 'Leave this match?',
    exitBody: 'You will lose the match in progress.',
    exitConfirm: 'Yes, exit',
    keepPlaying: 'Keep playing',
    close: 'Close',
    scoreTitle: 'Score',
    liveScore: (tricksLeft) => `Match in progress. ${plural(tricksLeft, 'trick', 'tricks')} left to play.`,
    myTricks: (n) => `My tricks (${n})`,
    noTricks: 'You have not taken any tricks yet.',
    tricksTotal: (n) => `Total in ${plural(n, 'trick', 'tricks')}`,
    player: 'Player',
    tricksTitle: 'Tricks',
    pointsTitle: 'Points',
    matchFinished: 'Match finished',
    backHome: 'Back to start',
    youWon: 'You won!',
    youLost: 'You lost',
    tieResult: 'Tie',
    settings: 'Settings',
    textSize: 'Text size',
    textSizes: { normal: 'Normal', large: 'Large', xlarge: 'Extra large' },
    plainFont: 'Plain font',
    plainFontHint: 'Uses a regular font instead of the pixel one.',
    reduceMotion: 'Turn off animations',
    reduceMotionHint: 'Windows and cards appear without moving.',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
    language: 'Language',
    install: 'Install app',
    developedBy: 'Developed by',
    otherGames: 'Other games',
    showOtherGames: 'Show other games',
    hideOtherGames: 'Hide other games',
    showOtherGamesHint: 'Links to the other card games: a side column on wide screens, a header button on narrow ones.',
  },
  es: {
    appName: 'Brisca',
    tagline: 'El juego de bazas con triunfo y naipe español, contra bots.',
    history: 'Historial',
    historyEmpty: 'Aquí aparecerán las partidas terminadas.',
    historySummary: (played, won) => `${played} jugadas · ${won} ganadas`,
    playerCount: (n) => `${n} jugadores`,
    outcomes: { won: 'Ganaste', tied: 'Empate', lost: 'Perdiste', abandoned: 'Abandonada' },
    rules: 'Reglas',
    difficulty: 'Dificultad',
    levels: { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' },
    levelHints: {
      easy: 'bots con reglas simples',
      medium: 'bots que piensan a futuro',
      hard: 'bots que cuentan cartas',
    },
    playWith: (players) => `${players} jugadores`,
    playMode: () => 'jugadores',
    pointsHint: 'Las demás cartas valen 0. Gana quien junta más puntos; si hay empate, deciden los monos (As 1, Rey 4, Caballo 3, Sota 2).',
    suits: SUITS,
    cardName: (card) => `${ES_RANKS[card.rank]} de ${SUITS[card.suit].toLowerCase()}`,
    you: 'Tú',
    bot: (n) => `Bot ${n}`,
    yourHand: 'Tu mano',
    yourTurn: 'Tu turno. Toca una carta dos veces para jugarla.',
    tapAgain: 'Tócala de nuevo para jugarla.',
    trump: 'Triunfo',
    trumpHeldBy: (name) => (name ? `En la mano de ${name}` : 'En tu mano'),
    trumpPlayed: 'Ya se jugó',
    turnedCard: 'Carta de triunfo',
    mustPlay: {
      follow: (lead) => `Debes seguir la pinta: juega una carta de ${lead}.`,
      beat: (lead) => `Debes ganar la baza: juega una carta de ${lead} más alta.`,
      trump: (lead, trump) => `No tienes ${lead}: debes jugar triunfo (${trump}).`,
      overtrump: (_lead, trump) => `Debes jugar un triunfo más alto (${trump}).`,
    },
    dealer: 'Repartidor',
    dealerIs: (name) => `Da: ${name}`,
    breakdown: { aces: 'Ases', threes: 'Treses', cantos: 'Cantos', last: 'Última', monos: 'Monos', none: 'Sin puntos' },
    pointsRows: [
      { label: 'As', detail: 'cada uno que te llevas', points: '10' },
      { label: 'Tres', detail: 'cada uno que te llevas', points: '10' },
      { label: 'Última baza', detail: 'para quien la gana', points: '10' },
      { label: 'Rey + Caballo', detail: 'de la misma pinta, golpeando', points: '20' },
      { label: 'Rey + Caballo de triunfo', detail: 'golpeando', points: '40' },
    ],
    knock: (points) => `Golpear (${points})`,
    knockHint: 'Golpea para cantar o tócala de nuevo para jugarla sin cantar.',
    knockIdle: 'Golpear',
    sortHand: 'Ordenar',
    cantoCall: (name, points) => `${name}: ¡${points}!`,
    cantoOf: (name, points) => `Canto de ${name} · ${points}`,
    tiebreakNote: 'Empate en puntos: deciden los monos.',
    ruleLead: 'Sale',
    ruleAnswer: 'Vale',
    ruleRemoved: 'Fuera',
    ruleNotAllowed: 'No vale',
    ruleBest: 'Gana',
    ruleDealerKeeps: 'Última carta: se la queda quien da',
    drawingDealer: 'Sorteando quién da',
    dealingCards: 'Repartiendo',
    music: 'Música',
    musicHint: 'Melodías chiptune con aire de guitarra española, una para el inicio y otra para la partida.',
    sounds: 'Efectos de sonido',
    soundsHint: 'Sonidos cortos al jugar una carta, al sortear quién da y al terminar la partida.',
    tricksWon: (n) => plural(n, 'baza', 'bazas'),
    pointsShort: (n) => `${n} pts`,
    exit: 'Salir',
    exitTitle: '¿Seguro que quieres salir?',
    exitBody: 'Se perderá la partida en curso.',
    exitConfirm: 'Sí, salir',
    keepPlaying: 'Seguir jugando',
    close: 'Cerrar',
    scoreTitle: 'Puntaje',
    liveScore: (tricksLeft) => `Partida en curso. Quedan ${plural(tricksLeft, 'baza', 'bazas')} por jugar.`,
    myTricks: (n) => `Mis bazas (${n})`,
    noTricks: 'Todavía no te has llevado ninguna baza.',
    tricksTotal: (n) => `Total en ${plural(n, 'baza', 'bazas')}`,
    player: 'Jugador',
    tricksTitle: 'Bazas',
    pointsTitle: 'Puntos',
    matchFinished: 'Fin de la partida',
    backHome: 'Volver al inicio',
    youWon: '¡Ganaste!',
    youLost: 'Perdiste',
    tieResult: 'Empate',
    settings: 'Ajustes',
    textSize: 'Tamaño del texto',
    textSizes: { normal: 'Normal', large: 'Grande', xlarge: 'Muy grande' },
    plainFont: 'Letra normal',
    plainFontHint: 'Usa una letra común en vez de la pixelada.',
    reduceMotion: 'Desactivar animaciones',
    reduceMotionHint: 'Las ventanas y cartas aparecen sin moverse.',
    toLight: 'Cambiar a modo claro',
    toDark: 'Cambiar a modo oscuro',
    language: 'Idioma',
    install: 'Instalar app',
    developedBy: 'Desarrollado por',
    otherGames: 'Otros juegos',
    showOtherGames: 'Mostrar otros juegos',
    hideOtherGames: 'Ocultar otros juegos',
    showOtherGamesHint: 'Enlaces a los otros juegos de naipes: una columna lateral en pantallas anchas y un botón en la cabecera en las angostas.',
  },
}

export const LocaleContext = createContext<Locale>(defaultLocale)

export function useLocale(): Locale {
  return useContext(LocaleContext)
}

export function useMessages(): Messages {
  return messages[useLocale()]
}
