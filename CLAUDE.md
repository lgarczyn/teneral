# Sporz Simulator

## Code Standards

- **Keep it simple.** Minimal code, no over-engineering. If it doesn't need to exist, delete it.
- **Don't repeat yourself.** Extract shared logic, but only when there's actual duplication — not preemptive abstraction.
- **Prettier for formatting.** All code goes through Prettier. No style debates.
- **Single responsibility.** Each function/module does one thing. Name it after what it does.
- **Functional style.** Prefer pure functions, immutable data, and composition. Avoid classes and mutation where practical.
- **TDD only where earned.** Write tests for code that has proven buggy or tricky — not everything upfront.

## Project Structure

- `code/app.jsx` — React UI (loaded via Babel standalone in-browser)
- `code/engine.js` — Game simulation engine
- `index.html` — Entry point for GitHub Pages (loads CDN deps + app.jsx)
- `graphics/` — SVG icons and role card HTML previews
