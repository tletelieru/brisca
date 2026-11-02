import type { Locale } from './locales'

interface RuleSection {
  tab: string
  rules: string[]
}

interface RulesText {
  sections: RuleSection[]
}

export const rulesText: Record<Locale, RulesText> = {
  en: {
    sections: [
      {
        tab: "Basics",
        rules: [
          "Trick-taking game with a 40-card Spanish deck: oros, copas, espadas and bastos.",
          "2 or 3 players, or 4 in pairs.",
          "Each player holds 3 cards. After every trick, everyone draws one, starting with the winner.",
          "The card turned up after the deal sets the trump suit for the whole game.",
        ],
      },
      {
        tab: "Tricks",
        rules: [
          "You may play any card: following suit is not required.",
          "A trump beats any card of another suit. Otherwise the highest card of the suit led wins.",
          "Order, from high to low: Ace, 3, King, Knight, Jack, 7, 6, 5, 4, 2.",
        ],
      },
      {
        tab: "Points",
        rules: [
          "Ace 11, three 10, king 4, knight 3, jack 2. The rest are worth nothing.",
          "There are 120 points in the deck. More than 60 wins the game.",
        ],
      },
    ],
  },
  es: {
    sections: [
      {
        tab: "Base",
        rules: [
          "Juego de basas con naipe español de 40 cartas: oros, copas, espadas y bastos.",
          "2 o 3 jugadores, o 4 en parejas.",
          "Cada jugador tiene 3 cartas. Después de cada basa todos sacan una, partiendo por el que ganó.",
          "La carta que se da vuelta después del reparto marca el triunfo de toda la partida.",
        ],
      },
      {
        tab: "Basas",
        rules: [
          "Puedes jugar cualquier carta: no es obligatorio seguir la pinta.",
          "Un triunfo le gana a cualquier carta de otra pinta. Si no hay triunfo, gana la más alta de la pinta que salió.",
          "Orden de mayor a menor: As, 3, rey, caballo, sota, 7, 6, 5, 4, 2.",
        ],
      },
      {
        tab: "Puntos",
        rules: [
          "As 11, tres 10, rey 4, caballo 3, sota 2. El resto no vale.",
          "Hay 120 puntos en el mazo. Gana quien junta más de 60.",
        ],
      },
    ],
  },
}
