# client-content

High-level, type-safe query and mutation builder for the Contember Content API.

## ContentClient

Main facade for executing operations:
- `query(query)` / `query(Record<string, ContentQuery>)` — execute queries
- `mutate(mutation)` / `mutate(mutations[])` — execute mutations
- `mutateOrThrow()` — throws `MutationFailedError` on failure

## ContentQueryBuilder

Requires `SchemaNames` (runtime schema metadata) at construction:

```typescript
const qb = new ContentQueryBuilder(schemaNames)

// Queries
qb.list('Article', { filter: { published: { eq: true } }, limit: 10 }, it => it.$('title').$('author', {}, it => it.$('name')))
qb.get('Article', { by: { id: '...' } }, it => it.$('title'))
qb.count('Article', { filter: { ... } })

// Mutations
qb.create('Article', { data: { title: 'New' } })
qb.update('Article', { by: { id: '...' }, data: { title: 'Updated' } })
qb.delete('Article', { by: { id: '...' } })
qb.transaction([mutation1, mutation2])
```

## ContentEntitySelection

Fluent field selector with `$()` operator:
- `$(field)` — scalar column
- `$(field, {}, selection)` — has-one relation with nested selection
- `$(field, { filter, orderBy, limit }, selection)` — has-many relation
- `$$()` — select all scalar fields
- `.omit(...fields)` — exclude fields

## Code Generation

`@contember/client-content-generator` generates fully-typed SDK from schema:
1. `names.ts` — runtime `SchemaNames` object
2. `entities.ts` — TypeScript entity types with unique constraints, columns, relations
3. `enums.ts` — enum union types
4. `index.ts` — typed `ContentQueryBuilder` instance

Usage: `contember-client-generator <schema.json> <output-dir>`

## Architecture

Operations are represented as AST (`ContentOperation`) with a parse function. `GraphQlQueryPrinter` serializes to GraphQL strings. Delegates to `@contember/graphql-client` for HTTP execution.
