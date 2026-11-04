import type { Locale } from './locales'

export type RuleExampleId =
  | 'deck'
  | 'seating'
  | 'removed'
  | 'deal'
  | 'trumpCard'
  | 'turns'
  | 'follow'
  | 'mustBeat'
  | 'mustTrump'
  | 'overtrump'
  | 'trumpBeats'
  | 'order'
  | 'points'
  | 'canto'
  | 'monos'

export interface Rule {
  text: string
  example?: RuleExampleId
}

interface RuleSection {
  tab: string
  rules: Rule[]
}

interface RulesText {
  sections: RuleSection[]
}

export const rulesText: Record<Locale, RulesText> = {
  en: {
    sections: [
      {
        tab: 'Basics',
        rules: [
          {
            text: 'Trick-taking game with a 40-card Spanish deck: oros, copas, espadas and bastos, numbered 1 to 7 plus the jack (10), knight (11) and king (12).',
            example: 'deck',
          },
          { text: '3 or 4 players, each one playing on their own.', example: 'seating' },
          {
            text: 'With 3 players the 2 of bastos is removed, leaving 39 cards.',
            example: 'removed',
          },
          {
            text: 'The whole deck is dealt in packets, starting with the player after the dealer: with 3 players a packet of 6 and then a packet of 7 (13 cards each); with 4 players two packets of 5 (10 cards each).',
            example: 'deal',
          },
          {
            text: 'The last card dealt goes to the dealer and is shown face up: its suit is trump for the whole match. The dealer keeps it and plays it like any other card.',
            example: 'trumpCard',
          },
          {
            text: 'Play goes counterclockwise. The player after the dealer leads the first trick, and whoever wins a trick leads the next.',
            example: 'turns',
          },
        ],
      },
      {
        tab: 'Tricks',
        rules: [
          { text: 'Whoever leads may play any card.' },
          { text: 'If you have the suit led, you must play it.', example: 'follow' },
          {
            text: 'While nobody has trumped, you must also beat the best card on the table if you can.',
            example: 'mustBeat',
          },
          { text: 'If you have none of the suit led, you must play a trump.', example: 'mustTrump' },
          {
            text: 'If someone already trumped, you must play a higher trump if you can. If you cannot, play any card.',
            example: 'overtrump',
          },
          { text: 'With neither the suit led nor trumps, play any card.' },
          {
            text: 'A trump beats any card of another suit. Otherwise the highest card of the suit led wins.',
            example: 'trumpBeats',
          },
          {
            text: 'Order, from high to low: Ace, 3, King, Knight, Jack, 7, 6, 5, 4, 2.',
            example: 'order',
          },
        ],
      },
      {
        tab: 'Points',
        rules: [
          {
            text: 'Only aces and threes are worth points: 10 each. Every other card is worth 0.',
            example: 'points',
          },
          { text: 'Whoever wins the last trick gets 10 more points.' },
          {
            text: 'Canto: if you hold the King and the Knight of the same suit, knock when you play the first of the two to sing it: 20 points, or 40 in trumps. It counts for you even if someone else takes that trick. Play it without knocking and the canto is lost.',
            example: 'canto',
          },
          {
            text: 'Most points wins. On a tie, count the monos in your tricks: Ace 1, King 4, Knight 3, Jack 2. If it is still level, the match is a tie.',
            example: 'monos',
          },
        ],
      },
    ],
  },
  es: {
    sections: [
      {
        tab: 'Base',
        rules: [
          {
            text: 'Juego de bazas con naipe español de 40 cartas: oros, copas, espadas y bastos, del 1 al 7 más sota (10), caballo (11) y rey (12).',
            example: 'deck',
          },
          { text: 'De 3 o 4 jugadores, y cada uno juega por su cuenta.', example: 'seating' },
          {
            text: 'Con 3 jugadores se saca el 2 de bastos y quedan 39 cartas.',
            example: 'removed',
          },
          {
            text: 'Se reparte todo el mazo en paquetes, partiendo por el jugador que está después del que da: con 3 jugadores, un paquete de 6 y luego uno de 7 (13 cartas cada uno); con 4, dos paquetes de 5 (10 cartas cada uno).',
            example: 'deal',
          },
          {
            text: 'La última carta repartida le toca al que da y se muestra boca arriba: su pinta (palo) es el triunfo de toda la partida. El que da se la queda y la juega como cualquier otra carta.',
            example: 'trumpCard',
          },
          {
            text: 'Se juega en sentido contrario a las agujas del reloj. Parte el que está después del que da, y quien gana una baza sale en la siguiente.',
            example: 'turns',
          },
        ],
      },
      {
        tab: 'Bazas',
        rules: [
          { text: 'El que sale puede jugar cualquier carta.' },
          { text: 'Si tienes de la pinta que salió, debes jugarla.', example: 'follow' },
          {
            text: 'Mientras nadie haya fallado con triunfo, además debes matar la carta más alta de la mesa si puedes.',
            example: 'mustBeat',
          },
          { text: 'Si no tienes de la pinta que salió, debes fallar con un triunfo.', example: 'mustTrump' },
          {
            text: 'Si alguien ya falló, debes jugar un triunfo más alto si puedes. Si no puedes, juegas la carta que quieras.',
            example: 'overtrump',
          },
          { text: 'Si no tienes ni de la pinta que salió ni triunfos, juegas cualquier carta.' },
          {
            text: 'Un triunfo le gana a cualquier carta de otra pinta. Si no hay triunfo, gana la más alta de la pinta que salió.',
            example: 'trumpBeats',
          },
          {
            text: 'Orden de mayor a menor: As, 3, rey, caballo, sota, 7, 6, 5, 4, 2.',
            example: 'order',
          },
        ],
      },
      {
        tab: 'Puntos',
        rules: [
          {
            text: 'Solo los ases y los treses dan puntos: 10 cada uno. Las demás cartas valen 0.',
            example: 'points',
          },
          { text: 'Quien gana la última baza suma 10 puntos más.' },
          {
            text: 'Canto: si tienes el rey y el caballo de la misma pinta, golpea la mesa al jugar el primero de los dos para cantarlo: 20 puntos, o 40 si es de triunfo. Te cuenta aunque otro se lleve esa baza. Si lo juegas sin golpear, pierdes el canto.',
            example: 'canto',
          },
          {
            text: 'Gana quien junta más puntos. Si hay empate, se cuentan los monos de sus bazas: as 1, rey 4, caballo 3, sota 2. Si siguen iguales, es empate.',
            example: 'monos',
          },
        ],
      },
    ],
  },
}
