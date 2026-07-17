# Infrastructure Layer — repository.ts & adapters/

The infrastructure layer implements the port interfaces defined in the
domain. It is the only layer permitted to talk to databases, external HTTP
APIs, the filesystem, or any I/O sink.

## repository.ts — Data Access

The repository owns all query-builder / ORM code for its module's tables.
Nothing else in the module touches the ORM's imports or schema tables
directly.

### Structure

```ts
// modules/feature/repository.ts (illustrative — substitute your ORM)
import type { Db } from '../../db/client.js';
import type { FeatureRow } from '../../db/rows.js';

export interface InsertFeature {
  scopeId: string;
  name: string;
  config?: unknown;
}

export class FeatureRepository {
  constructor(private db: Db) {}

  async list(scopeId: string): Promise<FeatureRow[]> { /* ... */ }
  async getById(scopeId: string, id: string): Promise<FeatureRow | undefined> { /* ... */ }
  async insert(data: InsertFeature): Promise<FeatureRow> { /* ... */ }
}
```

### Rules for repository.ts

- Return raw data-store row types (e.g. `FeatureRow` inferred from the
  schema) — never domain DTOs
- Scope every query by tenant/workspace where that concept exists: every
  method receives the scope id and filters by it
- Keep queries in the repository; no ORM calls in `service.ts`
- Cross-entity repositories (those that join across module boundaries) live
  on the composition root directly, not inside a single module folder
- Never throw HTTP errors — only throw plain errors or domain errors

## adapters/ — External Integrations

Each adapter implements an interface from the shared contracts package:

```
adapters/
  auth/local.ts          → implements AuthProvider
  external-api/client.ts → implements ExternalApiClient
  llm/provider-a.ts      → implements LLMProvider
  llm/provider-b.ts      → implements LLMProvider
  search/index.ts        → implements CodeIndex
```

### Rules for adapters/

- One file per provider/technology (not one file per use case)
- Implement the interface fully — callers only ever see the interface type,
  never the concrete class
- Configuration and secrets come from the composition root / a secrets
  provider, never read directly from the environment inside an adapter
- Adapters may throw domain errors but not web-framework HTTP errors

## Schema Changes

Database schema lives under a dedicated `db/schema/` directory. To add a
column or table:

1. Edit the schema file
2. Generate a migration with your migration tool
3. Apply the migration
4. **Never hand-edit generated migration files**
