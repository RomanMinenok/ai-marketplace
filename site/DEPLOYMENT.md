# Deployment

The site is a static build deployed to GitHub Pages via GitHub Actions —
there is no server, no manual upload step, and no separate hosting account.

## How it works

`.github/workflows/pages.yml` runs on every push to `main` that touches
`site/**`, `plugins/**`, `.claude-plugin/marketplace.json`, or
`scripts/build-site-data.mjs` (also triggerable manually via
`workflow_dispatch`):

1. **Build job** (`ubuntu-latest` runner)
   - `node scripts/validate-marketplace.mjs` — structural lint safety net
   - `npm ci` in `site/`
   - `npm run build` in `site/`, which itself:
     - regenerates `site/public/data/*.json` from the live catalog
       (`.claude-plugin/marketplace.json` + `plugins/`)
     - typechecks (`tsc -b`)
     - produces the production bundle in `site/dist/`
   - uploads `site/dist/` as a Pages artifact
2. **Deploy job** — publishes that artifact via `actions/deploy-pages`

Nothing runs on the GitHub Pages servers themselves; they only serve the
already-built static files from the last successful deploy job.

## One-time setup (manual, cannot be committed as a file)

Before the first deploy, in the repo's GitHub settings:

**Settings → Pages → Source: `GitHub Actions`**

(not "Deploy from a branch" — that mode runs Jekyll and expects a
`gh-pages` branch or a `/docs` folder, neither of which this setup uses.)

## Base path

The site is served at `https://<owner>.github.io/ai-marketplace/` (a project
page, not a custom domain), so `site/vite.config.ts` sets:

```ts
base: '/ai-marketplace/'
```

If the repository is ever renamed, this value must be updated to match, or
every asset and internal link will 404.

## Permissions

`pages.yml` declares the minimum permissions `actions/deploy-pages` needs:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

plus a `github-pages` deployment `environment` on the deploy job. Without
these, the deploy step fails with a permissions error — this is not
something the one-time Pages setting above covers on its own.

## Verifying a deploy

- **Actions tab** → `Deploy marketplace site` → latest run: both `build` and
  `deploy` jobs green
- The `deploy` job's `github-pages` environment shows the live URL
- Since the catalog starts empty, a successful first deploy just shows the
  Home page's empty-catalog state — that's expected, not a bug
