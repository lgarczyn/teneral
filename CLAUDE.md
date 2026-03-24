# Teneral — Social Deduction Game Simulator

## What This Is

A browser-based simulator and visualizer for "Teneral," a social deduction game (similar to Werewolf/Mafia). An AI engine plays complete games autonomously while a React UI provides step-through playback, belief state visualization, and Monte Carlo win rate analysis. Supports 6–20 players with 7 roles: Alien, Doctor, Human, Duelist, Immune, Empath, Predisposed.

## Code Standards

- **Keep it simple.** Minimal code, no over-engineering. If it doesn't need to exist, delete it.
- **Don't repeat yourself.** Extract shared logic, but only when there's actual duplication — not preemptive abstraction.
- **Prettier for formatting.** All code goes through Prettier. No style debates.
- **Single responsibility.** Each function/module does one thing. Name it after what it does.
- **Functional style.** Prefer pure functions, immutable data, and composition. Avoid classes and mutation where practical.
- **TDD only where earned.** Write tests for code that has proven buggy or tricky — not everything upfront.

## Project Structure

```
code/
  app.jsx        — Game engine + React UI (single file, loaded via Babel standalone)
  engine.js      — Standalone game engine module (exported version of engine in app.jsx)
  styles.css     — Tailwind-only stylesheet (no custom styles)
graphics/
  roles/         — SVG icons and HTML card previews for each role
  back.svg       — Card back graphic
index.html       — GitHub Pages entry point (loads CDN deps + Babel + app.jsx)
package.json     — npm config (Prettier only)
README.md        — Game rules and player composition tables
```

## Architecture

- **No build step.** The app runs directly in the browser via Babel standalone transpilation of JSX. No bundler, no compile step.
- **CDN dependencies:** React 18, ReactDOM, PropTypes, Recharts, Tailwind CSS, Babel standalone — all loaded from CDN in `index.html`.
- **State management:** React hooks for UI state. Engine uses immutable state updates via `JSON.parse(JSON.stringify(...))`.
- **Engine is duplicated** in both `code/app.jsx` (lines 1–682) and `code/engine.js`. The app.jsx copy is what actually runs; engine.js is the standalone export.

### Key Components in app.jsx

| Component | Purpose |
|-----------|---------|
| `Sigil` | Renders inline SVG role icons |
| `PlayerCard` | Small card with role visualization |
| `EventLog` | Scrollable event history |
| `VisualizerPanel` | Main game playback — rooms, step controls, belief table |
| `ConfigPanel` | Game parameter sliders |
| `MonteCarloPanel` | Statistical win rate analysis with Recharts |
| `App` | Root component, manages tabs and localStorage |

### Engine Data Model

**Game state:** `{ players, rooms, tick, log, winner, cfg, pendingEvents, lastEvent }`

**Player state:** `{ id, name, role, infected, alive, infectedBy, killUsed, lieUsed, factionBelief, roleBelief, roleConfidence, roomId }`

**Gossip system:** Each role defines a `gossip()` function that propagates beliefs differently (honest roles share at reduced confidence; aliens spread misinformation).

### Engine Exports (engine.js)

`createGame`, `stepGame`, `stepGameEvent`, `runFullGame`, `runMonteCarlo`, `ROLE_DEFS`, `DEFAULT_CFG`, `isAlienTeam`

## Commands

| Action | Command |
|--------|---------|
| Format code | `npm run fmt` |
| Check formatting | `npm run fmt:check` |
| Run the app | Open `index.html` in a browser |

## Dev Dependencies

- `prettier` (^3.8.1) — the only dev dependency

## Deployment

Static GitHub Pages — just serves `index.html` directly. No CI/CD pipeline.
