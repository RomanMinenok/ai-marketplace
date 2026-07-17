# Layer Dependency Rules

## The Dependency Rule

Dependencies flow **inward only**. Each layer may import from layers inside
it, never from layers outside it.

```
Domain ← Application ← Infrastructure
Domain ← Application ← Presentation
```

The composition root (`container.ts` or equivalent) is the only place
allowed to import from all layers simultaneously — that is its entire
purpose.

## Allowed Imports Per Layer

### Domain (shared contracts / `types.ts`)
- Your schema-validation library (schema definition only)
- Language built-ins
- **Nothing else.** Zero framework imports.

### Application (`service.ts`)
- Domain types and port interfaces
- Other application-layer helpers within the same module
- Domain-level error types
- **Not allowed:** the ORM, the web framework, external SDK clients, concrete adapter classes

### Infrastructure (`repository.ts`, `adapters/*`)
- Domain types and port interfaces (to implement them)
- The ORM / data-access library — in repositories only
- External SDKs — in adapters only
- Domain-level error types
- **Not allowed:** the web framework, sibling module service files

### Presentation (`routes.ts` / controller)
- Web-framework types
- Schema-validation library — request/response schemas
- The module's `service.ts` (one hop outward max)
- Shared domain contracts
- Domain-level error types
- **Not allowed:** the ORM, concrete repository classes, adapter classes

### Composition root (`container.ts`)
- Everything — this is the only file with full visibility
- Its job is to wire ports to adapters and inject into services

## Import Guard: Quick Mental Model

Before writing an import, ask:
> "Is the thing I'm importing from a **more inner** layer than where I am?"

If yes → allowed.
If no → stop and redesign (extract an interface, pass via DI, or move the
logic).

## Cross-Module Imports

Modules must not import from each other's internal files directly.
Cross-module dependencies go through:

1. The composition root — it holds cross-cutting repositories
2. Shared domain contracts

```ts
// BAD — one module reaching into another module's internals
import { AgentsRepository } from '../agents/repository.js';

// GOOD — use the container's shared repo
const agents = container.agentsRepo;
```
