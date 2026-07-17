# Seasoned AI Marketplace

Internal [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) —
a catalog of the skills, agents and hooks we share across the team.

> **Private / team repository.** Everyone who can read this repo can install everything in the
> catalog, and plugins run trusted code inside a developer's session. See [docs/SECURITY.md](docs/SECURITY.md).

## Install

```bash
# inside Claude Code
/plugin marketplace add RomanMinenok/ai-marketplace
/plugin install <plugin-name>@seasoned-ai-marketplace
```

Or from the shell:

```bash
claude plugin marketplace add RomanMinenok/ai-marketplace
claude plugin install <plugin-name>@seasoned-ai-marketplace
```

To pick up new plugins and versions later:

```bash
claude plugin marketplace update seasoned-ai-marketplace
```

## Auto-enable for a project

Add this to a project's `.claude/settings.json` so teammates are prompted to install the
marketplace when they trust the folder:

```json
{
  "extraKnownMarketplaces": {
    "seasoned-ai-marketplace": {
      "source": { "source": "github", "repo": "RomanMinenok/ai-marketplace" }
    }
  },
  "enabledPlugins": {
    "<plugin-name>@seasoned-ai-marketplace": true
  }
}
```

## Catalog

| Plugin | Category | Description |
| --- | --- | --- |
| _(none yet)_ | | |

## Repository layout

```
.claude-plugin/marketplace.json   # the catalog — what exists and where to fetch it
plugins/                          # plugin sources (mono-repo: referenced by "./plugins/x")
docs/                             # guidelines, security policy, release process
.github/workflows/validate.yml    # CI: claude plugin validate on every PR
MARKETPLACE-RESEARCH.md           # background research: schemas, gotchas, sources
```

## Branch protection

CI is only a guardrail if it can't be walked around. Configure this once in the GitHub UI
(Settings → Branches → `main`) — it can't live in this repo:

- Require the **`Validate marketplace`** status check to pass before merging
- Require a pull request before merging (at least 1 approval, CODEOWNERS review)
- Disallow direct pushes to `main`

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md)
before adding a plugin. In short:

```bash
claude plugin validate .                        # catalog
claude plugin validate ./plugins/my-plugin --strict   # your plugin
claude plugin marketplace add ./                 # test locally before opening a PR
```

## Docs

- [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md) — plugin structure, manifest, requirements
- [docs/SECURITY.md](docs/SECURITY.md) — permissions, secrets, reviewing scripts
- [docs/RELEASES.md](docs/RELEASES.md) — versioning, updates, rollback
- [MARKETPLACE-RESEARCH.md](MARKETPLACE-RESEARCH.md) — the full research this repo is built on
