# dic

Lightweight, type-safe dependency injection container with builder pattern.

## Usage

```typescript
const container = new Builder({})
  .addService('db', () => new Database(config))
  .addService('repo', ({ db }) => new Repo(db))
  .setupService('repo', (repo, { db }) => repo.configure(db))
  .build()

container.repo  // lazily resolved with full type safety
```

## Key Features

- **Lazy resolution**: Services created on first access
- **Circular dependency detection**: Replaces factory with error-throwing function during resolution, detects re-entry
- **Deferred setup**: Setup callbacks execute after all nested dependencies resolve (tracks recursion level)
- **Service replacement**: `.replaceService('name', ({ inner }) => new Wrapper(inner))` — previous implementation accessible via `inner`
- **Type safety**: Compile-time validation that service names don't conflict, factories receive correct accessor types
- **Partial extraction**: `.pick('name1', 'name2')` creates sub-container with selected services

## Implementation

`Builder` accumulates `ServiceDefinition` objects (factory + setup[] + optional innerDefinition). `.build()` creates `ContainerImpl` with `Object.defineProperty` lazy getters. Services are cached in a Map after first resolution.
