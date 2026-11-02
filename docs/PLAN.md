# Plan de desarrollo — Brisca

Brisca con naipe español contra bots, para 2, 3 o 4 jugadores en parejas.

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

### 1. Motor
- Naipe español de 40 cartas: 1–7, sota (10), caballo (11) y rey (12) de oros, copas, espadas y bastos.
- Reparto de 3 cartas, triunfo dado vuelta al fondo del mazo, sacar carta después de cada baza partiendo por el ganador.
- Sin obligación de seguir pinta. Orden: As, 3, rey, caballo, sota, 7, 6, 5, 4, 2.
- Puntaje: As 11, 3 10, rey 4, caballo 3, sota 2. Total 120; gana más de 60.
- Parejas con 4 jugadores, sentados en cruz.

Listo cuando, con tests de propiedades sobre miles de partidas al azar:
- Ninguna carta se pierde ni se duplica y la suma de puntos es siempre 120.
- La partida termina cuando se acaban mazo y manos.
- Toda acción fuera de `legalActions` se rechaza.

### 2. Bots y simulador
- Fácil: reglas simples (no botar puntos si se pierde la baza, cargar cuando gana el compañero).
- Medio: Monte Carlo con manos rivales muestreadas, porque no hay obligación de seguir pinta.
- Difícil: cuenta cartas jugadas y triunfos que quedan; en parejas coordina con el compañero.

Listo cuando: `pnpm sim` muestra difícil > medio > fácil en N partidas.

### 3. Mesa
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

## Pendiente

- Confirmar variante chilena (3 cartas en mano) y si se canta algo.
