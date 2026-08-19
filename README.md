# fruit-geography-game

Physics fruit merge game with geography power-ups.

**Fruit Atlas** is a Suika-style merge game built with [Vite](https://vitejs.dev/) and
the [matter-js](https://brm.io/matter-js/) physics engine. Drop fruit into the jar;
two of the same fruit merge into the next, bigger fruit. Every fruit is tagged with a
top-producing country, and merging charges geography-themed power-ups.

## Gameplay

- Move the pointer to aim, then click / tap (or press `Space`) to drop a fruit.
- Matching fruit merge into the next tier and score points.
- Merges fill the **charge** meter, which powers three geography abilities:
  - 🌍 **Earthquake** — jolts every fruit to reshuffle the pile.
  - 🌋 **Volcano** — erupts the biggest fruit for bonus points.
  - 🧭 **Continental Drift** — pulls all fruit toward the centre to force merges.
- Keep the pile below the danger line or it's game over.

## Getting started

Requires Node.js 22+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:5173
npm run build    # produce a production build in dist/
npm run preview  # preview the production build
```

## Testing

Headless [Playwright](https://playwright.dev/) checks run against the dev server.
Start the dev server (`npm run dev`) in one terminal, then in another:

```bash
npx playwright install chromium   # one-time: download the browser binary
npm run test:smoke                # asserts drop + merge + power-up logic
npm run test:visual               # renders the board and saves screenshots to test/output/
```

## Project structure

```
index.html          # app shell and layout
src/main.js         # UI wiring, input handling, HUD updates
src/game.js         # matter.js physics, merge logic, power-ups, rendering
src/data.js         # fruit tiers (with countries) and power-up definitions
src/style.css       # styling
.cursor/            # Cloud Agent environment configuration
```
