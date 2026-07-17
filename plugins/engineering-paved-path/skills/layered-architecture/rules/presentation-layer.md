# Presentation Layer — routes.ts

The presentation layer translates HTTP into application-layer calls and
back. It knows about the web framework, HTTP verbs, status codes, and
request/response schemas. It knows nothing about databases or external
APIs.

## Structure

```ts
// modules/feature/routes.ts (illustrative — substitute your web framework
// and schema-validation library)
import { FeatureContract } from '<shared-contracts>';
import { getContext } from '../_shared/context.js';
import { NotFoundError } from '../../platform/errors.js';
import { FeatureService } from './service.js';

export default async function featureRoutes(app) {
  const svc = new FeatureService(app.container);

  app.get('/features', { schema: { response: { 200: FeatureContract } } }, async (req) => {
    const { scopeId } = getContext(req);
    return svc.list(scopeId);
  });

  app.post('/features', { schema: { body: CreateFeatureBody, response: { 201: FeatureContract } } },
    async (req, reply) => {
      const { scopeId } = getContext(req);
      const feature = await svc.create(scopeId, req.body);
      return reply.code(201).send(feature);
    },
  );
}
```

## Responsibilities

- Define schemas for HTTP **request** bodies and **response** shapes inline
  or import from the shared contracts package
- Extract the scope/tenant id via a context helper — never trust raw
  request params for scoping
- Map HTTP inputs to `service.ts` input types (name remapping, coercion)
- Handle domain errors (e.g. `NotFoundError` → 404) by letting the
  framework's error handler propagate them — no manual status-code branching
  scattered through handlers
- Return domain DTOs directly — the framework serializes via the response
  schema

## Schema Placement

| Schema type | Where to define |
|-------------|-----------------|
| Response contract (shared with the client) | shared contracts package |
| Request body (HTTP-only) | inline in `routes.ts` |
| Reusable param shapes (`IdParams`) | `modules/_shared/schemas.ts` |

## Rules

- `routes.ts` imports only: `service.ts`, shared contracts, `modules/_shared/`,
  domain errors, the web framework, the schema-validation library
- Never import the ORM, repository classes, or adapter classes in `routes.ts`
- Never construct `new FeatureRepository(...)` in a route — only
  `new FeatureService(app.container)`
- Use one schema-validation approach consistently for all routes
- Streaming/SSE routes live in `routes.ts`; the event bus lives on the
  composition root
- Middleware (auth guards, rate limiting) is registered as framework hooks,
  not inline in handlers
