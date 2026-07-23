# MAA Defence Stores — React App

Converted from the original static HTML/CSS/vanilla-JS site into a proper
Vite + React project.

## Setup

```bash
npm install
npm run dev       # start local dev server
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

## Structure

- `src/data/` — product catalog, ranks, accessories, division config (plain data, no logic)
- `src/context/` — CartContext (cart state, drawer, totals) and ToastContext (notifications)
- `src/components/` — one component per site section (Header, Hero, Customizer, Shop, etc.)
- `public/assets/` — original product/uniform images

## Fixes made during conversion

1. `assets/army_uniform.png` was referenced everywhere but never existed in the
   asset folder — the real file is `military_uniform.png`. All references fixed.
2. The Uniform Builder only worked for some of its 7 division tabs due to
   mismatched keys between the HTML tabs and the JS division logic. Unified
   into a single `divisions.js` config so all 7 divisions (Army, NCC, Air Force,
   Navy, Scouts & Guides, Police, Security) work correctly.
3. Shop catalog filter buttons (`uniform`, `boots`, etc.) didn't match any
   actual product `category` values, so most filters returned nothing. Filters
   now match the real categories (`headwear`, `clothing`, `accessories`,
   `tactical`, `general`).
