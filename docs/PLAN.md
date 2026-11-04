# Plan de desarrollo — Brisca

Brisca con naipe español contra bots, para 3 o 4 jugadores, cada uno por su cuenta.

## Stack

Igual que 7 de Trébol: **web en TypeScript**, PWA instalable, sin backend.

| Área | Elección |
| --- | --- |
| Monorepo | pnpm workspaces |
| Lenguaje | TypeScript estricto |
| Mesa, menús, puntaje | React 19 + Tailwind 4 |
| Build | Vite + vite-plugin-pwa |
| Tests | Vitest + fast-check |
| Bots | Web Worker, mismo contrato que 7 de Trébol |
| Online | Node + WebSockets, servidor autoritativo (fase futura) |

## Estructura

```
apps/
  client/        PWA: mesa, menús, audio
  sim/           CLI de self-play bot contra bot
packages/
  engine/        estado, acciones legales, puntaje. Puro, sin dependencias de UI
  bots/          fácil, medio, difícil
```

## Contrato del motor

```ts
createMatch(config: MatchConfig, seed: number): MatchState
legalActions(state: MatchState, seat: Seat): Action[]
applyAction(state: MatchState, action: Action): MatchState
viewFor(state: MatchState, seat: Seat): PlayerView
score(state: MatchState): Score
```

```ts
interface Bot {
  choose(view: PlayerView, legal: Action[], rng: Rng): Action
}
```

- Estado inmutable y serializable: sirve para guardar partida y para el servidor.
- RNG con semilla: toda partida se puede reproducir.
- Los bots reciben `PlayerView`, nunca `MatchState`. Así no pueden hacer trampa.

## Paleta

Vino / burdeos: mesa de bodega española, donde el oro de los oros resalta. Las copas en mesa oscura usan `#ff7a85` para no perderse contra el fondo.

| Var | Claro | Oscuro |
| --- | --- | --- |
| `--bg` | `#f1e3dc` | `#241014` |
| `--surface` | `#fcf3ee` | `#33181e` |
| `--raised` | `#e6d1c7` | `#47242b` |
| `--ink` | `#2e1a1c` | `#f5e9e4` |
| `--muted` | `#6b5153` | `#c4a9ab` |
| `--accent` | `#9b2335` | `#e0566b` |
| `--on-accent` | `#ffffff` | `#1f0b0e` |
| `--gold` | `#8f5b0c` | `#f0b541` |

## Fases

### 0. Base del repo
- Workspace pnpm, TS, ESLint, Vitest y CI (lint, typecheck, test, build) sobre PRs y pushes a `dev` y `main`. Pages se publica desde `main`.
- Cliente con el baseline ox: EN/ES, claro/oscuro, ícono, footer, ajustes de accesibilidad y la paleta de arriba.
- Mazo definido en `packages/engine/src/cards.ts` con test de cantidad y unicidad.
- En `ox-proxy/projects.json`: `"brisca": { "port": 5185, "base": "/brisca" }`.

Listo cuando: el link de `ox-test` abre el cliente y CI pasa.

### 1. Motor (hecho)
- Naipe español de 40 cartas: 1–7, sota (10), caballo (11) y rey (12) de oros, copas, espadas y bastos.
- Se reparte todo el mazo en paquetes desde el jugador después del que da: con 3 jugadores 6 y luego 7 (13 cada uno, sin el 2 de bastos); con 4, 5 y 5 (10 cada uno). La última carta le toca al que da, se muestra boca arriba y su pinta es el triunfo; el que da se la queda en la mano.
- Obligación de jugar: asistir a la pinta que salió; si nadie falló, matar si se puede; sin la pinta, fallar con triunfo; si ya hay triunfo, montar si se puede, y si no, cualquier carta. Orden: As, 3, rey, caballo, sota, 7, 6, 5, 4, 2.
- Puntaje: As 10, tres 10, última baza 10. Canto de rey + caballo de la misma pinta: 20, o 40 en triunfo, golpeando al jugar el primero de los dos. Desempate por monos: As 1, rey 4, caballo 3, sota 2.
- Cada jugador por su cuenta, también con 4.

Listo cuando, con tests de propiedades sobre miles de partidas al azar:
- Ninguna carta se pierde ni se duplica y la suma de puntos es siempre 80 + 10 de la última + los cantos.
- La partida termina cuando se acaban las manos.
- Toda acción fuera de `legalActions` se rechaza.

### 2. Bots y simulador (hecho)
- Fácil: reglas simples (no botar puntos si se pierde la baza, fallar solo si la baza lo vale).
- Medio: Monte Carlo con manos rivales muestreadas.
- Difícil: cuenta cartas, deduce quién no tiene una pinta o no puede matar, y resuelve el final exacto.

Listo cuando: `pnpm sim` muestra difícil > medio > fácil en N partidas.

### 3. Mesa (hecho)
- Inicio: dificultad y cantidad de jugadores. Mesa, resultados, reglas, historial, guardar y retomar partida.
- Bots en Web Worker.

Listo cuando: se juega una partida completa en el celular.

### 4. Pulido
- Animaciones de reparto y movimiento de cartas, música chiptune, efectos, texto grande, letra normal, sin animaciones.

### 5. Publicación
- Pages desde `main`. En tletelieru pasa de `soon` a `live` en la sección Juegos.

## UI propia

- `SpanishCard` con íconos de oros, copas, espadas y bastos en pixel art. Escoba reutiliza este componente.
- Colores por pinta: oros dorado, copas rojo (`#c2362f` en carta, `#ff7a85` en mesa oscura), espadas azul, bastos verde.

## Decisiones de las fases 1 a 3

- **Una partida = una mano.** No hay serie a varias manos ni puntaje acumulado entre partidas; el historial guarda cada partida por separado.
- **Motor:** `MatchState` guarda manos, triunfo, baza en curso, bazas jugadas y cantos (`cantos`: quién, pinta, puntos, baza y carta). No hay mazo para sacar. `dealOrder` arma el reparto en paquetes. `playRequirement` calcula las cartas permitidas y la regla que obliga (`follow`, `beat`, `trump`, `overtrump` o `free`); `legalActions` la usa y agrega la variante `golpe: true` cuando la carta es el primer rey o caballo de una pareja en mano. `score` devuelve puntos por jugador, desglose (ases, treses, cantos, última), monos y si hubo desempate. El turno avanza al asiento siguiente, en sentido contrario a las agujas del reloj como en 7 de Trébol.
- **Con 3 jugadores se saca el 2 de bastos**, así 39 cartas se reparten en partes iguales.
- **Gana quien suma más puntos.** Si hay empate arriba, deciden los monos de las bazas de cada uno; si siguen iguales, es empate.
- **Canto:** se golpea al jugar el primero del rey y el caballo; si se juega sin golpear, el canto se pierde. Cuenta para quien canta aunque otro se lleve la baza: la carta queda boca arriba en su montón si la gana, o boca abajo y marcada en el montón de otro (que igual suma sus monos).
- **`PlayerView`** muestra la mano propia, cuántas cartas tiene cada uno, el triunfo, las bazas y los cantos.
- **Fácil:** reglas simples, sin búsqueda: sale con la carta más barata, no bota puntos en una baza perdida y falla con triunfo solo si en la mesa hay 10 puntos o más. Siempre golpea.
- **Medio:** Monte Carlo con 4 mundos por jugada: reparte al azar las cartas que no ve entre las otras manos (el triunfo dado vuelta queda con el que da), juega cada opción hasta el final con la política fácil y elige la de mejor resultado.
- **Difícil:** Monte Carlo con 48 mundos que respetan lo deducido de las bazas (quién no tiene una pinta, quién no pudo matar o montar), simula con una política que cuenta cartas y resuelve exacto el final cuando quedan 9 cartas o menos en juego.
- **Tiempo de los bots:** las simulaciones usan un reparto mutable propio en vez de `applyAction` y cada jugada tiene un tope de tiempo (60 ms medio, 120 ms difícil) además del número de mundos.
- **Cliente:** `SpanishCard` y `SpanishSuitIcon` (pixel art de 11×11) son el componente compartido con Escoba. Tamaños `sm`, `md`, `lg` y `xl`; el triunfo se marca con un fondo dorado. Colores por pinta en variables CSS (`--suit-*` en la carta y `--table-*` en la mesa). En la mesa clara el oro usa `#8f5b0c` y en la oscura `#f0b541` para que el texto se lea; en la carta se usa `#c9930e`.
- **Eventos:** el historial, los sonidos de jugada (`ACTION_SOUNDS` y el golpe del canto), el anuncio del canto, el cambio de música cuando te quedan 3 cartas o menos y el jingle final salen de `act` en `useMatch`, no de un efecto. ESLint (`local/no-effect`) exige justificar cada efecto que queda: timers de bots y del sorteo, guardar la partida, Web Audio, tecla Escape, prompt de instalación y ajustes en `<html>`.
- **Cartas:** el índice es el número impreso (1–7, 10, 11, 12), también en inglés. Cada figura tiene su dibujo: sota = paje de pie, caballo = cabeza de caballo, rey = corona.
- **Ayudas solo en fácil:** en medio y difícil la mesa no marca qué carta va ganando la baza. El triunfo siempre se muestra porque es información pública.
- **Sin saltos de diseño:** la línea de estado, el botón de golpear y la mano ocupan siempre el mismo espacio; la mano usa dos filas de cartas encimadas (hasta 7 por fila) con alto fijo, y las cartas que no se pueden jugar se ven apagadas, nunca se esconden. Al tocar una, la línea de estado explica qué regla obliga.
- **Sorteo de quién da:** el motor elige el repartidor al azar con la semilla. Al empezar una partida nueva, un foco dorado salta de asiento en asiento en orden de turno (~2 s, al menos una vuelta, cada vez más lento), se detiene en el repartidor y muestra "Da: …" 0,8 s antes del reparto. Tic por salto y campana al detenerse (`DRAW_SOUNDS`). Sin animaciones muestra el resultado directo; las partidas retomadas no sortean; los bots esperan.
- **Música propia:** tres temas chiptune con el motor de 7 de Trébol y melodías nuevas: inicio (100 bpm) y partida (108 bpm) sobre la cadencia andaluza Am–G–F–E con bajo de triángulo punteado, y uno más tenso (112 bpm, Am–Bb–Am–E) cuando te quedan 3 cartas o menos. `SETUP_TRACKS` asigna tema a cada momento (inicio, partida, últimas cartas). Música y efectos se apagan por separado en Ajustes.
- **Reglas ilustradas:** cada regla es texto más un ejemplo opcional (`RuleExample`) con cartas reales: el mazo por pinta, el 2 de bastos fuera, los paquetes del reparto, la carta de triunfo, asistir, matar, fallar, montar, el orden, los puntos, los cantos y los monos.

## Pendiente

Supuestos de variante tomados para las fases 1 a 3; falta confirmarlos:

- No se puede cambiar el triunfo dado vuelta por el 7 (o el 2) del triunfo.
- Si no se puede montar sobre un triunfo, se juega cualquier carta (no se obliga a tirar un triunfo menor).
- La partida es una sola mano; falta decidir si se juega a varias manos (por ejemplo, a 2 de 3).
- Las reglas no dicen nada sobre ver la última baza; hoy la mesa la muestra un momento y luego se puede revisar en "Mis bazas".
