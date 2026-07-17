# Engineering Paved Path

A bundle of framework-agnostic engineering-practice skills — the "paved
path" other plugins in this marketplace build on. Install it directly for
its own skills, or install `sdd-engineering`/`architecture-review`, which
pull it in automatically as a dependency.

## What's inside

First-party skills, shipped in this plugin's `skills/` directory:

| Skill | Covers |
| --- | --- |
| `react-best-practices` | Modern React conventions and anti-patterns — hooks misuse, state patterns, performance, data fetching |
| `react-component-architecture` | Where code lives in a React feature — folder layout, constants/helpers/hooks/styles placement, container/presenter split, prop patterns. Framework-agnostic: works with Next.js, Remix, Vite, or plain CRA |
| `react-testing-library` | Testing React components/hooks with RTL + Vitest — query priority, `userEvent`, async patterns, common anti-patterns |
| `security` | OWASP Top 10:2025 web application security — auth, input handling, file uploads, secrets |
| `mermaid-diagram` | Authoring Mermaid diagrams (flowcharts, sequence, state, ER, class) in Markdown |
| `layered-architecture` | Onion/Hexagonal (Ports & Adapters) layered architecture for a backend module — domain/application/infrastructure/presentation layers, DI container, anti-patterns. Illustrative examples use generic placeholders (`<Framework>`, `<ORM>`, `<Schema>`) you substitute for your own stack |

Plus five third-party skills pulled in as **dependencies** (see
[`docs/PLUGIN-GUIDELINES.md`](../../docs/PLUGIN-GUIDELINES.md#third-party-skills)
for why they aren't bundled as this plugin's own files):

| Skill | Covers |
| --- | --- |
| `fastify-best-practices` | Building/configuring/debugging Fastify servers |
| `next-best-practices` | Next.js file conventions, RSC boundaries, data fetching |
| `typescript-expert` | Type-level programming, monorepo/tooling, migrations |
| `postgresql-table-design` | Postgres schema design — types, indexing, constraints |
| `drizzle-orm-patterns` | Drizzle ORM schema, queries, relations, migrations |

## Using it

Skills load automatically when their `description` matches what you're
doing — you rarely need to invoke them by name. When you do (e.g. from
another plugin's agent), reference them by namespace:

```
engineering-paved-path:react-best-practices
engineering-paved-path:layered-architecture
engineering-paved-path:security
```

## `layered-architecture` in depth

The skill's `rules/` subfolder breaks the pattern down layer by layer —
read these when you need the detail, not just the summary in `SKILL.md`:

- `rules/layers.md` — the dependency rule and import guards per layer
- `rules/domain-layer.md` — entities, contracts, port interfaces
- `rules/application-layer.md` — service/use-case patterns
- `rules/infrastructure-layer.md` — repository and adapter patterns
- `rules/presentation-layer.md` — route/controller patterns
- `rules/di-container.md` — the composition root and test overrides
- `rules/anti-patterns.md` — eight concrete violations, each with a bad/good example

## Provenance

`react-best-practices`, `react-testing-library`, `security`, and
`mermaid-diagram` were already framework-agnostic in their source form and
are carried over unchanged. `layered-architecture` (from `onion-architecture`)
and `react-component-architecture` were rewritten to remove a hardcoded
backend file layout and a Next.js+Mantine-specific framing — see this
plugin's `CHANGELOG.md`.

## Install

```
/plugin marketplace add ./
/plugin install engineering-paved-path@seasoned-ai-marketplace
```
