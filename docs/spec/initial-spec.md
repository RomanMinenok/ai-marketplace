# Specification: Marketplace UI (GitHub Pages, React + Vite)

## Context

This repository (`ai-marketplace`) is a private Claude Code plugin marketplace
(`.claude-plugin/marketplace.json`, name: `seasoned-ai-marketplace`). At the
time of writing, `plugins/` is empty (only `.gitkeep`) — the repo has not yet
been populated with real plugins, so the build pipeline described here must
work correctly with zero plugins and scale as plugins are added.

The goal is a static UI application on GitHub Pages that gives marketplace
users full-content search across everything a plugin can contain, one-click
install, per-plugin and per-artifact detail views, and a "what's new" feed —
with no backend (GitHub Pages is pure static hosting; there is no server or
database).

This spec was first scoped to 5 features (plugin/skill/agent search only, no
facets, no command palette). A visual design mockup (`Catalog.dc.html`,
reviewed 2026-07-17) was then produced that implements a materially richer
version of the same idea, and the user confirmed the design supersedes the
earlier trimmed scope. **This document reflects the design as the source of
truth.** Star ratings, comparison tables, and an actual RSS feed generator
remain out of scope (the design's "Subscribe · RSS" link is a placeholder,
see Open Questions).

Features in scope:

1. Full-text fuzzy search across **six** artifact kinds — `plugin`, `skill`,
   `agent`, `command`, `hook`, `mcp` — results as cards, with facets (kind,
   keyword, author) and sort (relevance / name / recently updated)
2. "Copy install" button on every card, plugin page, and artifact page
3. Detail views with deep-link routing: one page per plugin (`#/plugin/:name`)
   and one page per sub-artifact (`#/artifact/:kind/:plugin/:name`)
4. "What's new" — a changelog feed built from each plugin's CHANGELOG.md,
   with a condensed preview on Home and a full page
5. Getting Started (onboarding) — 3-step "how to connect this marketplace"
   flow with copy-paste commands
6. A **command palette** (⌘K / Ctrl+K) for instant jump-to-artifact from
   anywhere in the app
7. Dark/light theme toggle

**Decisions made with the user:**
- The marketplace name used in `/plugin install` and `/plugin marketplace add`
  commands is **`seasoned-ai-marketplace`**, read dynamically from
  `marketplace.json` at build time — **not** hardcoded, and **not** the
  `dev-digest-ai-marketplace` / `burnjohn/...` placeholder values baked into
  the design mockup's demo data (those are mockup placeholders, not real
  repo values — see Open Questions)
- All six kinds (`plugin`, `skill`, `agent`, `command`, `hook`, `mcp`) are
  indexed, faceted, and browsable — this reverses an earlier interim decision
  to exclude `command` from the index; that decision is superseded by the
  design
- The **`compatibility` badge is a real feature**: a new optional field is
  added to `plugin.json` (`compatibility`, free-text string, e.g.
  `"Claude Code ≥ 1.4"`, `"MCP 0.4+"`, `"beta"`) — `docs/PLUGIN-GUIDELINES.md`
  needs updating to document it once implementation starts
- **CHANGELOG.md entries get a date**: the convention becomes
  `## x.y.z — YYYY-MM-DD` (newest first, same as today, just with a date
  appended to the heading) — needed so "what's new" can sort/display
  correctly; `docs/PLUGIN-GUIDELINES.md`'s example needs updating to match
- **Tools/permissions per artifact**: deferred — left as an open question
  until a real plugin exists to confirm the actual source shape (see Open
  Questions). The schema field stays in the index (section B) but the build
  script may emit an empty array until this is resolved
- **RSS/"Subscribe" link removed**: the What's New page does **not** get a
  Subscribe/RSS affordance in v1 — dropped entirely, not just deferred

## A. File Layout

A new top-level directory **`site/`** — a self-contained Vite project
(React + TypeScript), deployed via GitHub Actions artifact
(`actions/upload-pages-artifact` + `actions/deploy-pages`), **not** via
`/docs` on `main` (docs/ is already used for prose documentation) and not via
a `gh-pages` branch.

`site/` is a sibling of `plugins/`, `docs/`, and `.claude-plugin/` — it is
purely the UI application's own source tree (its own `package.json`,
`node_modules`, build output) and never reads or writes marketplace content
in place. It only ever *consumes* `plugins/` and `.claude-plugin/` as
read-only inputs to the build script (section C); nothing in the marketplace
directories is touched or depended upon by `site/`'s own tooling (no shared
`node_modules`, no shared lockfile, no shared `.gitignore` rules beyond the
top-level one). This keeps marketplace content (what CI lints and what
Claude Code actually loads) fully independent from the website's build
artifacts.

```
site/
├── package.json / vite.config.ts     # base: '/ai-marketplace/' for Pages
├── index.html
├── src/
│   ├── main.tsx
│   ├── router.tsx                    # HashRouter (react-router-dom)
│   ├── pages/
│   │   ├── Home.tsx                  # hero search, stat tiles, what's-new preview, browse-by-kind
│   │   ├── Search.tsx                 # #/search — facets sidebar + result cards
│   │   ├── PluginDetail.tsx          # #/plugin/:name
│   │   ├── ArtifactDetail.tsx        # #/artifact/:kind/:plugin/:name
│   │   ├── WhatsNew.tsx              # #/whats-new
│   │   └── GettingStarted.tsx        # #/getting-started — static content
│   ├── components/
│   │   ├── Card.tsx                  # + Copy install button, kind badge
│   │   ├── SearchBox.tsx             # global + hero search input
│   │   ├── CommandPalette.tsx        # ⌘K modal, keyboard-driven jump-to-artifact
│   │   ├── FacetSidebar.tsx          # kind / keyword / author facets with counts
│   │   └── ThemeToggle.tsx           # dark/light switch
│   └── lib/
│       ├── search.ts                 # Fuse.js indexing + facet/sort logic over search-index.json
│       └── theme.ts                  # persists theme choice (localStorage), no backend needed
├── public/data/                      # build script writes JSON here; Vite copies as-is into dist/data/
│   ├── search-index.json
│   ├── plugins.json
│   └── changelog-feed.json
└── fixtures/                         # sample plugin data for local preview without real data
    ├── marketplace.sample.json
    └── plugins/sample-plugin/...
```

`site/public/data/*.json` is gitignored (it's a build artifact, generated by
script, never committed — consistent with the rest of the repo not
committing build artifacts).

## B. Search Index Schema

A single flat array, one entry per plugin **and** one entry per sub-artifact
of every kind found inside it: `skill`, `agent`, `command`, `hook`, `mcp`.
Every field maps to a real field in `marketplace.json` / `plugin.json` /
`SKILL.md` / `agents/*.md` / `commands/*.md` / `hooks/hooks.json`, plus one
field (`compatibility`) flagged below as not yet backed by any real schema
field — see Open Questions.

```jsonc
// site/public/data/search-index.json
[
  {
    "id": "plugin:my-plugin",           // plugin: "plugin:<name>"; artifact: "<kind>:<plugin>/<name>"
    "kind": "plugin",                   // "plugin" | "skill" | "agent" | "command" | "hook" | "mcp"
    "pluginName": "my-plugin",          // FK — always the owning plugin's name
    "name": "my-plugin",                // artifact's own name ("my-skill" for a skill, etc.)
    "displayName": "My Plugin",         // plugin.json displayName / entry.displayName; artifact: derived title
    "description": "...",               // marketplace.json entry.description, or SKILL.md/agent/command frontmatter description
    "category": "backend",              // marketplace.json entry.category (free text, no enum) — artifacts inherit parent's
    "keywords": ["backend", "react"],   // plugin.json keywords[] and/or entry.keywords[] — artifacts inherit parent's
    "tags": [],                         // entry.tags[]
    "author": { "name": "...", "email": null, "url": null }, // plugin.json author — artifacts inherit parent's
    "version": "1.0.0",                 // from plugin.json ONLY (marketplace.json forbids version per CI)
    "updated": "2026-07-08",            // date from the latest "## x.y.z — YYYY-MM-DD" CHANGELOG.md heading
    "compatibility": "Claude Code ≥ 1.4", // new optional plugin.json field, free text, plugin entries only
    "license": "MIT",
    "homepage": null,
    "repository": null,
    "source": "./plugins/my-plugin",
    "invocation": "/my-skill",          // artifact only: slash-command form for skill/command, "@name" for agent, "" for hook/mcp
    "tools": ["Read", "Edit"],          // artifact only: declared tools/permissions (see Open Questions — shape unconfirmed)
    "content": "description + full text of SKILL.md/agent/command body, or hooks.json summary, for search",
    "route": "/plugin/my-plugin"        // artifact: "/artifact/<kind>/<plugin>/<name>"
  }
]
```

Notes:
- `plugin` entries are built from `marketplace.json` + `plugin.json`.
  Artifact entries are one per file under `plugins/<name>/skills/*/SKILL.md`,
  `agents/*.md`, `commands/*.md`, and one per matcher/entry inside
  `hooks/hooks.json` and any declared `mcpServers` config — id follows the
  existing `<plugin-name>:<component-name>` addressing convention.
- `content` is the only field the search library indexes with high weight
  on top of `description`/`name`/`keywords` — it holds the raw body text so
  fuzzy search can match on documentation content, not just metadata.
- `category` stays free-text (no enum), per the existing repo convention.
- `compatibility` (e.g. `"Claude Code ≥ 1.4"`, `"MCP 0.4+"`, `"beta"`,
  shown as a badge on the plugin detail page) is a **new optional field on
  `plugin.json`**, free-text string, read straight through into the index.

`plugins.json` (keyed by plugin name) — full detail payload for the plugin
page: parsed README content, grouped list of artifacts by kind (with counts,
matching the design's "Склад плагіна" section), dependencies (`plugin:artifact`
references, resolved to a clickable link if the target plugin exists in the
catalog), and changelog entries.

`changelog-feed.json` — `[{ pluginName, displayName, version, date, summary }]`,
one row per CHANGELOG.md entry across all plugins, parsed from the
`## x.y.z — YYYY-MM-DD` heading format, flattened and sorted newest-first by
date. Powers both the Home "What's new" preview (top 4) and the full
`#/whats-new` page.

## C. Build Script

New file: **`scripts/build-site-data.mjs`** — same style as the existing
`scripts/validate-marketplace.mjs` (Node, no dependencies,
`readFileSync`/`readdirSync`).

- Reads `.claude-plugin/marketplace.json` + each
  `plugins/<name>/.claude-plugin/plugin.json` + `CHANGELOG.md` +
  `skills/*/SKILL.md` + `agents/*.md` + `commands/*.md` + `hooks/hooks.json`
  + any `mcpServers` config
- Writes the three JSON files into `site/public/data/`
- With zero plugins, produces valid but empty output (`[]`, `{}`, `[]`)
  without erroring — mirroring the `nullglob`-style guard already used in
  `validate.yml`
- Accepts a `--source <dir>` flag (default: real `plugins/` +
  `marketplace.json`) so it can instead point at `site/fixtures/` for local
  preview with populated sample data (the fixtures should mirror the
  design's demo dataset — 6 plugins spanning all 6 kinds — so the local
  preview looks like the mockup), without touching the real (empty) catalog

## D. Routing and Pages

`HashRouter` (react-router-dom) — GitHub Pages has no server-side rewrites,
so any routing other than hash-based breaks on a direct link. Vite's `base`
is set to `/ai-marketplace/` (the repo name) so asset paths resolve
correctly.

- `#/` — **Home**: hero search box + top-keyword chips, stat tiles (one per
  kind, clickable → filtered search), "What's new" preview (4 most recent),
  "Browse by type" tiles (6 kinds with counts). Shows an explicit empty-catalog
  state (no plugins yet) with a CTA to Getting Started / CONTRIBUTING.md.
- `#/search` — **Search**: sidebar facets (kind, keyword, author, each with
  counts and toggle state) + sort dropdown (relevance/name/updated) + result
  cards (kind badge, version, displayName, 2-line description, top keywords,
  meta line, Copy install + Open buttons). Explicit no-results state with a
  "reset filters" action.
- `#/plugin/:name` — **Plugin detail**: header (icon, displayName, version
  badge, compatibility badge, author, updated date), install command bar
  (Copy + "View on GitHub"), "Склад плагіна" grouped by kind with per-artifact
  cards (linking to artifact detail), Dependencies (linking to other plugins),
  README, Changelog.
- `#/artifact/:kind/:plugin/:name` — **Artifact detail**: breadcrumb (Catalog
  / parent plugin / artifact), kind badge, invocation badge (if any),
  description, Tools/permissions chips (if any), install command bar (installs
  the **parent plugin** — components are not installed individually),
  rendered documentation body.
- `#/whats-new` — full reverse-chronological changelog feed, each row linking
  to its plugin. No Subscribe/RSS affordance (removed from v1, see decisions
  above).
- `#/getting-started` — static content (not build-data-dependent): 3
  numbered steps — (1) add marketplace as a source, (2) install a specific
  plugin, (3) `marketplace update` to refresh sources — each with a
  copy-paste command bar, plus a short explanatory note on
  "marketplace update" vs. "plugin update" semantics.
- **Command palette** (not a route — a global modal, ⌘K / Ctrl+K from
  anywhere): text input, live-filtered flat list of all artifacts (max ~8
  shown), Escape or backdrop click to close, Enter/click to jump.

Deep-linking mechanics: on load, the router reads `location.hash`, fetches
the relevant JSON from `site/public/data/*.json` (same-origin static fetch,
no CORS issues on Pages), and renders. Direct links
(`https://<user>.github.io/ai-marketplace/#/plugin/my-plugin`) work out of
the box since GitHub Pages always serves `index.html` and the hash resolves
client-side.

## E. CI/CD

New **`.github/workflows/pages.yml`**, separate from `validate.yml`:
- Trigger: `push` to `main` (paths: `site/**`, `plugins/**`,
  `.claude-plugin/marketplace.json`, `scripts/build-site-data.mjs`)
- Steps: checkout → setup-node → `node scripts/build-site-data.mjs` →
  `npm ci && npm run build` (in `site/`) → `actions/upload-pages-artifact`
  (path `site/dist`) → `actions/deploy-pages`
- Runs `validate-marketplace.mjs` before the build as a cheap safety net
  (in case of a direct push to `main` bypassing branch protection), without
  duplicating all of `validate.yml`
- **Manual one-time step for the repo owner** (cannot be committed as a
  file): Settings → Pages → Source = "GitHub Actions"

### GitHub Pages compatibility checklist (verified against Vite's official
static-deploy guide)

- **Deployment method**: Vite's own docs state that deploying to GitHub
  Pages requires GitHub Actions (a build step is mandatory before serving),
  confirming the `actions/upload-pages-artifact` + `actions/deploy-pages`
  approach in section A/E is correct — not a `gh-pages` branch, not raw
  `/docs` on `main`.
- **`base` path**: since this is a project page served from a repository
  sub-path (`https://<user>.github.io/ai-marketplace/`), `vite.config.ts`
  must set `base: '/ai-marketplace/'` — Vite only defaults to `/` for a
  root/custom-domain deployment, which does not apply here. Every asset
  reference (JS imports, CSS `url()`, `index.html` tags) is rewritten by
  Vite at build time based on this value, so it must exactly match the repo
  name.
- **Workflow permissions**: `pages.yml` needs an explicit `permissions`
  block (`contents: read`, `pages: write`, `id-token: write`) and a
  `github-pages` deployment `environment`, otherwise `actions/deploy-pages`
  fails with a permissions error.
- **Jekyll bypass**: because deployment goes through the Actions artifact
  pipeline (not a branch GitHub scans itself), GitHub does **not** run
  Jekyll over the output — a `.nojekyll` file is not required for this
  deployment method (it would only matter for the legacy "deploy from a
  branch" mode, which this spec does not use).
- **Hash routing**: confirmed as the correct choice — GitHub Pages serves
  `index.html` for the bare project-page path and performs no server-side
  rewrites, so `HashRouter` avoids the `404.html`-redirect workaround that
  path-based routing would otherwise require, and deep links resolve
  correctly on a fresh load, including for the command palette's jump
  targets.
- **Repo owner manual step** (already listed above): Settings → Pages →
  Source = "GitHub Actions" must be set once before the first deploy.

## F. Copy Install (Feature 2 detail)

Copied string template: `/plugin install <plugin-name>@seasoned-ai-marketplace`,
where `<plugin-name>` comes from the `pluginName` field of the search index
entry — never hardcoded, and used identically whether copied from a card, a
plugin detail page, or an artifact detail page (artifacts install their
parent plugin, there is no per-artifact install command). A toast
("Скопійовано в буфер" / "Copied to clipboard") confirms the action; the
button label itself also flips to a checkmark state for ~2s.

## G. Visual Design Notes

The design mockup establishes a concrete visual language worth carrying into
implementation, not just the structural layout:
- Typography: IBM Plex Sans (UI text) + IBM Plex Mono (badges, versions,
  code, counts)
- Dark theme by default, with a light theme variant and a header toggle;
  colors defined via CSS custom properties using OKLCH, so both themes share
  one set of derived tokens rather than duplicated palettes
- Each of the 6 kinds has its own accent hue (`--kind-plugin`, `--kind-skill`,
  `--kind-agent`, `--kind-command`, `--kind-hook`, `--kind-mcp`) used
  consistently for badges, facet dots, and stat tiles across every screen

## Open Questions

- **Tools/permissions per artifact** (the only item still genuinely open):
  the design shows a `tools` list per skill/agent/command (e.g.
  `['Read','Edit','Grep']`). The real source for this is unconfirmed —
  likely SKILL.md frontmatter and/or `hooks/hooks.json` matchers. Deferred
  until a real plugin exists with this metadata; the build script emits an
  empty array for `tools` in the meantime, and the UI simply hides the
  Tools/permissions section when the array is empty.

Resolved (kept here for traceability, not re-open):
- Marketplace identity: build reads owner/repo/marketplace name from
  `marketplace.json` at build time, never the mockup's
  `dev-digest-ai-marketplace` / `burnjohn` placeholders.
- `compatibility`: added as a new optional free-text field on `plugin.json`.
- CHANGELOG dates: convention becomes `## x.y.z — YYYY-MM-DD`.
- RSS/Subscribe link: removed from v1 entirely.
- Zero-plugin testing: fixture-based preview (`site/fixtures/`) confirmed.
- Markdown rendering: client-side via `react-markdown`, confirmed.

## Spec Document Location

This document lives at `docs/spec/initial-spec.md`.

## Verification

- Locally: `cd site && npm install && npm run dev:fixtures` (or plain
  `npm run dev` to see the real, currently-empty catalog) — both scripts
  regenerate `site/public/data/*.json` before starting Vite. Verify search
  with facets/sort, the command palette (⌘K), cards' Copy install button
  (check clipboard content + toast), plugin detail and artifact detail
  deep-links, the what's-new page, getting-started page, and the theme
  toggle. See `site/README.md` for the full local-testing walkthrough.
- `npm run build` (inside `site/`) — regenerates data from the real catalog,
  typechecks (`tsc -b`), and produces `site/dist/`; this is exactly what CI
  runs.
- `node scripts/validate-marketplace.mjs` — confirm the new tooling doesn't
  break the existing linter
- Verify the CI build (`pages.yml`) with zero plugins (only `.gitkeep`) —
  should deploy successfully with an empty search index and the empty-catalog
  Home state
