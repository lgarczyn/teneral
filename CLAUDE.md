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
  engine.js          — Game engine (pure logic, no UI)
  setup.js           — Shared React/Recharts destructuring
  Sigil.jsx          — SVG role icon component
  PlayerCard.jsx     — Small card with role visualization
  EventLog.jsx       — Scrollable event history + event formatting
  VisualizerPanel.jsx — Main game playback — rooms, step controls, belief table
  ConfigPanel.jsx    — Game parameter sliders
  MonteCarloPanel.jsx — Statistical win rate analysis with Recharts
  app.jsx            — Root App component + mount
graphics/
  roles/             — SVG icons and HTML card previews for each role
  back.svg           — Card back graphic
index.html           — GitHub Pages entry point (loads CDN deps + all scripts in order)
package.json         — npm config (Prettier only)
README.md            — Game rules and player composition tables
```

## Architecture

- **No build step.** The app runs directly in the browser via Babel standalone transpilation of JSX. No bundler, no compile step.
- **CDN dependencies:** React 18, ReactDOM, PropTypes, Recharts, Tailwind CSS, Babel standalone — all loaded from CDN in `index.html`.
- **State management:** React hooks for UI state. Engine uses immutable state updates via `JSON.parse(JSON.stringify(...))`.
- **Engine** lives in `code/engine.js` (plain JS, no JSX). All UI components are in separate `.jsx` files.
- **Global scope sharing:** All scripts are loaded via `<script>` tags in `index.html`. `engine.js` and `setup.js` are plain JS; JSX files use Babel standalone. They share the global scope — functions and `var` declarations are accessible across files.

### Engine Data Model

**Game state:** `{ players, rooms, tick, log, winner, cfg, pendingEvents, lastEvent }`

**Player state:** `{ id, name, role, infected, alive, infectedBy, killUsed, lieUsed, factionBelief, roleBelief, roleConfidence, roomId }`

**Gossip system:** Each role defines a `gossip()` function that propagates beliefs differently (honest roles share at reduced confidence; aliens spread misinformation).

### Engine Globals (engine.js)

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
