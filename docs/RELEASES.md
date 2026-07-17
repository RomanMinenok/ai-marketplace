# Releases

How versions, updates and rollbacks work here. Background: [../MARKETPLACE-RESEARCH.md](../MARKETPLACE-RESEARCH.md) §7.

## How Claude Code resolves a version

First one that is set wins:

1. `version` in the plugin's `plugin.json`  ← **we use this**
2. `version` in the plugin's catalog entry  ← **we forbid this**
3. the git commit SHA of the plugin's source

The version decides the cache path and update detection. If the resolved version matches what a user
already has, `/plugin update` and auto-update **skip the plugin entirely**.

## Our rules

- **SemVer in `plugin.json`, always.** `MAJOR.MINOR.PATCH`.
- **Never in the catalog entry.** `plugin.json` wins silently, so a version in both places means a
  stale manifest can mask the catalog with no warning. CI rejects it.
- **Every release bumps.** CI compares against the PR base: if anything under `plugins/<name>/`
  changed and `version` didn't, the build fails. This is the one guardrail against the most common
  failure in this system — shipping a fix that no user ever receives.

### What to bump

| Change | Bump |
| --- | --- |
| Fix wording, a bug in a script, a broken path | PATCH |
| New skill/agent/command, new capability | MINOR |
| Removed or renamed a component, changed a hook's behaviour, anything that breaks a user's workflow | MAJOR |

## Release process

1. Make the change under `plugins/<name>/`.
2. Bump `version` in `plugins/<name>/.claude-plugin/plugin.json`.
3. Add an entry to `plugins/<name>/CHANGELOG.md`.
4. `node scripts/validate-marketplace.mjs` and `claude plugin validate ./plugins/<name> --strict`.
5. Open a PR. CI runs both.
6. Merge. Users get it on their next `/plugin marketplace update` + `/plugin update`, or via auto-update.

## Rollback

Because the version is explicit, rolling back is a normal commit:

1. Revert the plugin's files to the previous state.
2. Set `version` to a **new, higher** version (e.g. `1.2.0` → `1.2.1`), not back to the old one.
   Reusing an old version string means users who already have it will never pull the rollback —
   Claude Code sees "same version, nothing to do".
3. Note the revert in `CHANGELOG.md`.

> Rolling *back* by lowering the number does not work. The check is equality, not ordering.

## Renaming or removing a plugin

A plugin's `name` is a stable identifier — users reference it in `enabledPlugins`, `pluginConfigs`
and `/plugin install`. Changing it breaks every existing install.

- To change the label in the UI: set `displayName`, leave `name` alone.
- To actually rename or remove: add a top-level `renames` entry in the catalog.

```json
{
  "renames": {
    "old-name": "new-name",
    "deleted-plugin": null
  }
}
```

Claude Code then migrates users automatically — it rewrites the old key in user, project and local
settings and shows a one-line notice. Requires Claude Code ≥ 2.1.193; older versions report
`plugin-not-found`.

Rules:

- `renames` is **append-only history**. Never edit an old entry — add a new one. Claude Code follows
  chains, so `a → b` plus `b → c` resolves `a` all the way to `c`.
- `claude plugin validate .` rejects cycles and chains that don't terminate at `null` or a listed plugin.
- Plugins enabled through **managed settings** can't be rewritten (they're read-only to Claude Code),
  so the rename notice recurs until an admin updates them.

## Dependencies

If a plugin depends on another, pin the range — don't float:

```json
{ "dependencies": [{ "name": "secrets-vault", "version": "~2.1.0" }] }
```

Update the catalog and the plugin as **separate** commits, so a bad plugin release can be reverted
without touching the catalog and vice versa.
