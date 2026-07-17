# DI Container — platform/container.ts

The `Container` class is the **composition root**: the single place where
interfaces are bound to concrete implementations. It is the only file that
sees all layers simultaneously.

## Design

```
Container
  ├── config: AppConfig                    — loaded from env
  ├── db: Db                               — data-store client
  ├── secrets: SecretsProvider             — adapter
  ├── auth: AuthProvider                   — adapter
  ├── jobs: JobRunner                      — platform: scheduled jobs
  ├── eventBus: EventBus                   — platform: event/SSE bus
  ├── featureRepo: FeatureRepository       — cross-cutting repo (shared by modules)
  └── lazy adapters (search, llm, …)       — resolved via secrets on first call
```

## Adding a New Adapter

1. Define the interface in the shared contracts package (domain layer)
2. Implement it in `adapters/<technology>/`
3. Add a private `_field?: ConcreteType` cache property to `Container`
4. Expose it via a getter that resolves secrets lazily:

```ts
// platform/container.ts
private _myAdapter?: MyAdapter;

get myAdapter(): MyPort {
  if (!this._myAdapter) {
    const key = this.config.MY_API_KEY;
    if (!key) throw new ConfigError('MY_API_KEY not set');
    this._myAdapter = new MyAdapter(key);
  }
  return this._myAdapter;
}
```

5. Add the override to `ContainerOverrides` so tests can inject a mock:

```ts
export interface ContainerOverrides {
  // …existing overrides…
  myAdapter?: MyPort;
}
```

## Testing with ContainerOverrides

Tests never import concrete adapter classes. They override at construction
time:

```ts
// In a test
const container = buildTestContainer({
  myAdapter: {
    async doThing() { return mockResult; }
  }
});
const svc = new FeatureService(container);
```

This is why services must receive `Container` and resolve adapters from it,
rather than constructing adapters themselves.

## Rules

- `platform/container.ts` is the ONLY file allowed to import concrete
  adapter classes
- Lazy getters must check `ContainerOverrides` first:
  `this.overrides.myAdapter ?? lazyInit()`
- Invalidate any cached credentials after persisting a new secret/API key,
  so the next request picks up fresh credentials
- Cross-cutting repositories (those needed by more than one module) go on
  `Container`; module-owned repos are constructed inside `service.ts`
- The container is not a service locator — pass only the needed interface
  to functions that don't need full container access
