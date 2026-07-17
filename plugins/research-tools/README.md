# Research Tools

A single read-only research agent: `researcher`. Use it to find and
structure information — in a codebase or on the web — without touching
anything.

## What's inside

| Agent | Model | Tools | Role |
| --- | --- | --- | --- |
| `researcher` | sonnet | Read, Grep, Glob, WebSearch, WebFetch | Read-only investigator. Finds facts and returns a strictly structured, honest report. Never modifies anything. |

## Using it

Delegate to `researcher` (via the `Agent`/`Task` tool, `subagent_type:
"research-tools:researcher"`) whenever you need to:

- Locate code, config, or docs in a repository — "where is X handled",
  "which files reference Y"
- Gather external facts — library/API/tooling documentation, version
  behaviour, industry conventions

Example: "researcher, find where the retry logic for the payments client
lives" returns a project report; "researcher, what's the current rate
limit for the Stripe API" returns a web report.

It operates in one of two modes, and asks first if it's unclear which:

- **Project research** — `Grep`/`Glob`/`Read` over the codebase, every
  finding cited `path:line`
- **Web research** — `WebSearch`/`WebFetch`, every finding cited with a
  real URL and a reliability label (`official docs` / `primary source` /
  `blog` / …)

Both modes end with an explicit `Not found / gaps` section and a
`Confidence` rating — it never fabricates a file, line, quote, or URL, and
says plainly when it can't find something.

## What it won't do

- Never edits, creates, or deletes anything — no write tools, by design.
- Never spawns sub-agents or runs multi-round "deep research" — one
  focused pass, then report.
- Won't guess whether you meant the codebase or the web — it asks.

## Install

```
/plugin marketplace add ./
/plugin install research-tools@seasoned-ai-marketplace
```
