# Application Layer — service.ts

The application layer orchestrates domain objects and port interfaces to
fulfil use cases. It knows **what** needs to happen; the infrastructure layer
handles **how**.

## Responsibilities

- Implement one use case per public method (`list`, `get`, `create`,
  `update`, `delete`, orchestration methods)
- Call port interfaces (repositories, adapters) — never concrete
  implementations
- Map raw data-store rows to domain DTOs (`toFeatureDto`, `toFindingDto`, …)
- Enforce domain invariants and throw domain errors (`NotFoundError`,
  `ConflictError`)
- Never deal with HTTP status codes, request objects, or ORM query builders

## Constructor Pattern

The service receives the composition root (container) as its sole
constructor argument. It resolves what it needs from the container lazily or
eagerly — never by importing adapter classes directly.

```ts
// modules/feature/service.ts
import type { Container } from '../../platform/container.js';
import type { FeatureEntity } from '<shared-contracts>';
import { FeatureRepository } from './repository.js';
import { NotFoundError } from '../../platform/errors.js';

export class FeatureService {
  private repo: FeatureRepository;

  constructor(private container: Container) {
    this.repo = new FeatureRepository(container.db);
  }

  async list(scopeId: string): Promise<FeatureEntity[]> {
    const rows = await this.repo.list(scopeId);
    return rows.map(toFeatureDto);
  }

  async get(scopeId: string, id: string): Promise<FeatureEntity> {
    const row = await this.repo.getById(scopeId, id);
    if (!row) throw new NotFoundError('Feature', id);
    return toFeatureDto(row);
  }
}
```

## Input / Output Types

Define `CreateFeatureInput` and `UpdateFeatureInput` interfaces inside
`service.ts`. These are the application layer's own types — they may differ
from the HTTP body (the route maps HTTP → input, the service maps input →
data store).

```ts
export interface CreateFeatureInput {
  name: string;
  config?: unknown;
}
```

## Rules

- Services import `repository.ts` to construct the repo, but only call it
  through its public interface (no raw ORM calls inside `service.ts`)
- When a service needs an adapter (an LLM, an external API), it gets it from
  a container getter — never `new ConcreteAdapter(...)`
- Map data-store rows to domain types inside the service (or in
  `helpers.ts`); never leak the ORM's inferred row types to routes
- Throw domain errors from a shared `errors.ts`; the web framework's error
  handler maps them to HTTP status codes
- A service method = one use case. Keep them focused; extract helpers to
  `helpers.ts` if they grow
