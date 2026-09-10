# Solar Drift / Neon Drift

A small canvas arcade game built with Vite and browser APIs. Steer the ship, collect cyan energy shards, and avoid orange debris as the flight speed rises.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. Use Left/Right or A/D to steer. On touch screens, hold the left or right side of the game field.

## Deploy to Vercel

Import this folder into Vercel or run `vercel` from the project root. The included `vercel.json` uses Vite's `dist` output and applies long-lived caching to built assets plus baseline security headers.

The game is fully client-side. The best score is stored in the browser's local storage and is not synced between devices.
