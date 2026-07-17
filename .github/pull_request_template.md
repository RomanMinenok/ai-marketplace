## What changed

<!-- One or two sentences. What does a user of this plugin get or lose? -->

## Type

- [ ] New plugin
- [ ] Change to an existing plugin
- [ ] External source bump (`sha` change)
- [ ] Catalog / docs / CI only

## Checklist

<!-- See CONTRIBUTING.md. Delete rows that genuinely don't apply, don't tick blindly. -->

- [ ] `node scripts/validate-marketplace.mjs` green locally
- [ ] `claude plugin validate .` green
- [ ] `claude plugin validate ./plugins/<name> --strict` green
- [ ] Plugin invoked and observed working (not just validated)
- [ ] `version` bumped in `plugin.json` — required for any change to existing plugin files
- [ ] `CHANGELOG.md` updated
- [ ] No secrets, no absolute paths (`/Users/…`, `/home/…`)
- [ ] `${CLAUDE_PLUGIN_ROOT}` used for in-plugin paths
- [ ] External sources pinned to a full 40-char `sha`
- [ ] `CODEOWNERS` updated (new plugin)
- [ ] README catalog table updated

## Security review

<!-- Required if this PR adds or changes anything that executes: scripts, hooks, MCP servers.
     See docs/SECURITY.md. Plugins run trusted code on every installer's machine. -->

- [ ] Every script in this PR was read line by line
- [ ] No network calls to hosts we don't control
- [ ] Hooks: matcher scope and what the command does with intercepted calls is understood
- [ ] MCP servers: what they run, where they send data, who publishes them

## How this was tested

<!-- Real output, not "should work". -->
