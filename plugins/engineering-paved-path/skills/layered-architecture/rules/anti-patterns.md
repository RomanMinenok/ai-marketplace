# Anti-Patterns

Violations of the layered-architecture dependency rule. Each one breaks
testability, makes refactoring painful, or leaks infrastructure details into
business logic.

---

## 1. ORM calls in service.ts

```ts
// BAD — infrastructure (the ORM) leaks into the application layer
export class FeatureService {
  constructor(private db: Db) {}
  async list(scopeId: string) {
    return this.db.select().from(t.features).where(eq(t.features.scopeId, scopeId));
  }
}

// GOOD — service depends on a repository (port)
export class FeatureService {
  private repo: FeatureRepository;
  constructor(container: Container) {
    this.repo = new FeatureRepository(container.db);
  }
  async list(scopeId: string) {
    return (await this.repo.list(scopeId)).map(toFeatureDto);
  }
}
```

---

## 2. Web-framework request/response objects in service.ts

```ts
// BAD — service knows about HTTP
import type { Request } from '<web-framework>';
export class FeatureService {
  async create(req: Request) { … }
}

// GOOD — service takes domain input types
export class FeatureService {
  async create(scopeId: string, input: CreateFeatureInput) { … }
}
```

---

## 3. Direct repository import across module boundaries

```ts
// BAD — one module reaching into another module's internals
// modules/reviews/service.ts
import { AgentsRepository } from '../agents/repository.js';

// GOOD — use the shared cross-cutting repo on the container
const agents = container.agentsRepo;
```

---

## 4. Concrete adapter constructed inside service.ts

```ts
// BAD — service hardcodes the provider
import { OpenAIProvider } from '../../adapters/llm/openai.js';
export class ReviewService {
  private llm = new OpenAIProvider(process.env.OPENAI_API_KEY!);
}

// GOOD — get it from the container (resolves credentials lazily, supports overrides)
export class ReviewService {
  async run(provider: Provider) {
    const llm = await this.container.llm(provider);
    …
  }
}
```

---

## 5. Leaking data-store row types to routes

```ts
// BAD — route returns the raw ORM row
app.get('/features/:id', async (req) => {
  const row = await repo.getById(req.params.id);
  return row; // exposes internal column names, nullable fields, etc.
});

// GOOD — service maps to DTO before it reaches the route
app.get('/features/:id', async (req) => {
  return svc.get(scopeId, req.params.id); // returns FeatureEntity (domain type)
});
```

---

## 6. Reading environment variables inside an adapter

```ts
// BAD — adapter reads env directly (untestable without env manipulation)
export class MyAdapter {
  constructor() {
    this.key = process.env.MY_API_KEY!;
  }
}

// GOOD — key injected by the container
export class MyAdapter {
  constructor(private key: string) {}
}
// container.ts: new MyAdapter(await this.secrets.get('MY_API_KEY'))
```

---

## 7. HTTP status codes in service.ts

```ts
// BAD
if (!row) return reply.code(404).send({ error: 'not found' });

// GOOD — throw a domain error; the framework's error handler maps it
if (!row) throw new NotFoundError('Feature', id);
```

---

## 8. Business logic in routes.ts

```ts
// BAD — pagination logic, validation beyond input parsing, branching
app.get('/features', async (req) => {
  const features = await repo.list(scopeId);
  const filtered = features.filter(f => f.enabled && f.createdAt > cutoff);
  return filtered.slice(req.query.offset, req.query.offset + req.query.limit);
});

// GOOD — route delegates; service decides
app.get('/features', async (req) => {
  return svc.listEnabled(scopeId, req.query);
});
```
