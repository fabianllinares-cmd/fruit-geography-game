# fruit-geography-game

Mobile-first physics merge game with geography power-ups.

Drop matching objects so they merge into the next size. Merges charge
**geography energy**. When the meter is full you may attempt a power-up — but
only a correct multiple-choice geography answer actually activates it.

## Play

- Drag horizontally to aim, then release / tap to drop.
- Two objects of the **same level** merge into the next, larger object.
- Keep the stack below the danger line (a brief bounce over it is OK).
- Fill geography energy, then pick Shake / Sweep / Target and answer a question.

Themes (same engine, different skins):

1. Fruit Classic
2. Fruit Night
3. Tropical Island
4. Sports Arena
5. Nightcap Bar (drinks)

## Scripts

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # vitest unit tests
npm run build        # production build in dist/
npm run preview      # preview the production build
```

The production site is built for GitHub Pages at `/fruit-geography-game/`
(relative asset paths). A workflow in `.github/workflows/pages.yml` runs tests,
builds, and deploys `dist/`.

## Project structure

```
src/game/           physics, scoring, charge, danger, rendering
src/themes/         five data-driven skins
src/geography/      local question bank + challenge deck
src/ui/             HUD, overlays, input
src/persistence.ts  local save / best scores
src/audio.ts        Web Audio + haptics
```

Cloud Agent setup lives in `.cursor/environment.json` and is unchanged.
