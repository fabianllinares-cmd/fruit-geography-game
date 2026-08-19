# fruit-geography-game

Physics fruit-merge game with geography power-ups — **V1**.

**Fruit Geography** is a mobile-first, portrait physics merge game built with
[Vite](https://vitejs.dev/) and the [matter-js](https://brm.io/matter-js/)
engine. Drop objects into the jar; two of the same object merge into the next,
bigger one. Chain reactions score big. A shared geography challenge and three
power-ups tie it together — and the whole thing is **data-driven across five
themes**.

## Themes

All five themes share one engine, scoring system, power-ups and geography
questions — only the data changes (see `src/themes.js`):

1. **Fruit Classic** — bright orchard fruit (glossy light skin).
2. **Fruit Night** — neon berries on a starfield (dark skin).
3. **Tropical Island** — sunset/beach smoothie fruit (warm skin).
4. **Sports Arena** — procedurally drawn balls (ping-pong → champion cup).
5. **Cocktail Bar** — stylised drinks on frosted glass (18+ bar skin).

## Gameplay

- Touch/drag to aim, release (or tap) to drop. `Space` also drops on desktop.
- Matching objects merge into the next tier; higher tiers score much more.
- Merges (and correct geography answers) charge three power-ups:
  - 🌍 **Earthquake** — jolt everything to reshuffle the pile.
  - 🌋 **Volcano** — erupt the biggest object for bonus points.
  - 🧭 **Drift** — pull everything to the centre to force merges.
- 🌍 **Geo Challenge** — answer a world-geography question for bonus score and charge.
- Keep the pile below the danger line or it's game over. Best score is saved per theme.

## Object / level architecture

Each theme is a list of levels; the physics engine only reads the generic
fields, so it never cares whether an object is a fruit, a ball or a drink:

```js
{ id, name, visual: { type, ... }, radius, score, next, meta }
```

`visual.type` is `emoji` (glyph + colour disc) or `ball` (procedural pattern).
Radii/scores come from shared ramps in `src/themes.js`.

## Getting started

Requires Node.js 22+.

```bash
npm install      # install dependencies
npm run dev      # dev server at http://localhost:5173
npm run build    # production build in dist/
npm run preview  # preview the production build
```

## Testing

Headless [Playwright](https://playwright.dev/) checks run against the dev
server (portrait Android viewport). Start `npm run dev`, then:

```bash
npx playwright install chromium   # one-time browser download
npm run test:smoke                # all 5 themes merge; input, power-up, geo flow
npm run test:visual               # renders every theme + geo modal to test/output/
```

## Project structure

```
index.html          # menu + game shell (portrait, mobile-first)
src/main.js         # screen nav, touch input, HUD, power-ups, geo modal
src/game.js         # matter.js engine (theme-agnostic), merge logic, power-ups
src/render.js       # object rendering (emoji discs + procedural balls) + backgrounds
src/themes.js       # 5 data-driven themes, level ramps, power-up defs
src/geography.js    # geography question bank
src/style.css       # mobile-first styling with per-theme CSS variables
.cursor/            # Cloud Agent environment configuration
```
