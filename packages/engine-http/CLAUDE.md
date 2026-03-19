# engine-http

Koa-based HTTP/WebSocket layer that routes requests to Content, System, and Tenant GraphQL APIs. Handles multi-tenancy, authentication, project resolution, and monitoring.

## Request Flow

```
HTTP Request → Koa middleware (compress, bodyparse, CORS)
  → Route matching (path-to-regexp)
  → ProjectGroupResolver (tenant from domain/header)
  → Authenticator (Bearer token via ApiKeyManager)
  → API Controller (Content/System/Tenant/Import/Export)
  → GraphQL execution (with LRU-cached parsed documents)
  → Response (JSON, optional Server-Timing header in debug mode)
```

## Routes

- `/content/:projectSlug/:stageSlug` — Content GraphQL API (CRUD with ACL)
- `/system/:projectSlug` — System API (migrations, schema, stages)
- `/tenant` — Tenant API (auth, users, projects, memberships)
- `/import`, `/export` — NDJSON data transfer
- `/actions/:projectSlug` — Actions API (from plugin)
- `/health` — Internal health check

## Container Hierarchy

- `MasterContainer` — singleton, created at startup. Holds all factories, registers routes and plugins.
- `ProjectGroupContainer` — per tenant. Holds `TenantContainer` (tenant DB, auth), `SystemContainer`, `ProjectContainerResolver`.
- `ProjectContainer` — per project (cached by slug). Holds write/read DB connections, system DB context, content schema resolver.

## Multi-Tenancy

Two resolution modes:
1. **Domain mapping**: `projectGroup.domainMapping = '{group}.example.com'` — extracts tenant from subdomain
2. **Config header**: `projectGroup.configHeader` — Base64-encoded (optionally encrypted) config in request header

## Key Files

- `application/application.ts` — Koa app, route registration, request lifecycle
- `MasterContainer.ts` — DI container factory with all service definitions
- `content/ContentApiControllerFactory.ts` — Content API: schema resolution, membership check, GraphQL execution
- `projectGroup/ProjectGroupResolver.ts` — Tenant resolution
- `common/Authorizator.ts` — Token verification
- `config/configSchema.ts` — Server config validation schema
