# Marketplace UI

React + Vite static app for the catalog site, deployed to GitHub Pages by
`.github/workflows/pages.yml`. Full spec: [`../docs/spec/initial-spec.md`](../docs/spec/initial-spec.md).

## Local development

```bash
cd site
npm install

# Option A — real catalog (plugins/ at the repo root). Right now that's
# empty, so this shows the actual empty-catalog Home state.
npm run dev

# Option B — sample data (site/fixtures/, 6 plugins across all 6 kinds),
# for working on the UI without waiting on real plugins to land.
npm run dev:fixtures
```

Either command regenerates `site/public/data/*.json` first, then starts the
Vite dev server at **http://localhost:5173/ai-marketplace/** (the app is
served under the `/ai-marketplace/` base path in dev too, matching
production — visiting the bare `http://localhost:5173/` auto-redirects
there).

Things to click through once it's running:
- Home: hero search, keyword chips, stat tiles, "what's new" preview, browse-by-kind tiles
- `⌘K` / `Ctrl+K` — command palette, jump to any artifact
- Search (`/search`): facets (kind/keyword/author), sort, no-results state
- A plugin card → plugin detail page → an artifact card inside "Plugin composition" → artifact detail page → breadcrumb back
- "Copy install" on a card, on the plugin page, and on an artifact page — check the clipboard + toast + button checkmark
- `/whats-new` and `/getting-started`
- Theme toggle (☾/☀) in the header

## Rebuilding data without restarting the dev server

```bash
npm run data:build       # from the real plugins/ catalog
npm run data:fixtures    # from site/fixtures/
```

Vite dev serves `public/` as static files, so a re-run of either script is
picked up on the next browser refresh — no server restart needed.

## Production build

```bash
npm run build      # regenerates data from the real catalog, then tsc -b && vite build
npm run preview    # serve dist/ locally to sanity-check the production build
```

`npm run build` is exactly what CI runs in `.github/workflows/pages.yml`.

## Other checks

```bash
npx tsc -b        # typecheck only
npm run lint      # oxlint
node ../scripts/validate-marketplace.mjs   # unrelated marketplace structural lint, run from repo root
```
