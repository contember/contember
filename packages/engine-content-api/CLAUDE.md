# engine-content-api

Core GraphQL content API. Builds a per-project GraphQL schema from the Contember schema, resolves queries/mutations against PostgreSQL with ACL predicate injection.

## Query Flow

```
GraphQL query → GraphQlQueryAstFactory (ResolveInfo → ObjectNode AST)
  → ReadResolver.resolveListQuery/resolveGetQuery
  → Mapper.select/selectUnique
    → UniqueWhereExpander (expand unique where)
    → PredicatesInjector (inject ACL WHERE clauses)
    → SelectBuilder (build SQL with joins, ordering, pagination)
    → SelectHydrator (raw rows → nested objects with async relation fetching)
  → GraphQL response
```

## Mutation Flow

```
GraphQL mutation → MutationResolver.resolveTransaction
  → InputPreValidator (validate against entity rules)
  → Mapper.insert/update/delete
    → CreateInputVisitor/UpdateInputVisitor (traverse input)
    → SqlCreateInputProcessor/SqlUpdateInputProcessor (dispatch per field/relation)
    → Inserter/Updater/DeleteExecutor (build SQL, execute)
    → Post-operation callbacks (junction tables, events)
  → REPEATABLE_READ transaction with deadlock retry (up to 15 attempts)
```

## ACL Enforcement

Row-level and field-level security via predicate injection into every SQL operation:
- `Authorizator` — checks static permissions (yes/no/maybe per entity/field)
- `PredicateFactory` — converts ACL permission definitions to WHERE conditions
- `PredicatesInjector` — ANDs user predicates with ACL predicates on every query
- `VariableInjector` — replaces variable references with identity-specific values

### Read-path guarding

- `PredicateFactory.getFieldPredicate(...)` resolves a field's ACL predicate; `getPermissionsForContext(isRoot)` picks the permission set — root-only unless the caller passes `isRoot === false` (nested/relation context), which adds `through: true` permissions (`allPermissions`). An unknown context falls back to the narrower root set, so the two sets can **over-restrict, never leak**.
- Projection cell-masking happens during JS hydration (`SelectBuilder` maps `row => predicateGetter(row) ? row[alias] : null`), not in SQL. The predicate boolean column is also consumed by relation fetching (`getColumnValues`) and by the hydrator, so moving the mask into the SQL expression is not a local change.
- **`WhereOptimizer`'s `isLast` handling is deliberately conservative.** The obvious one-line "fix" (`Number(i) === relationPath.length` → `- 1`) drops the has-many `EXISTS` requirement, collapsing `{ articles: { author: { id: { isNull: false } } } }` to `{ id: { always: true } }` — an over-match. Verified empirically; it needs a real optimizer change, not a tweak.

## GraphQL Schema Building

`GraphQlSchemaBuilderFactory` → `GraphQlSchemaBuilder`:
- `QueryProvider` — generates get/list/paginate queries per entity (ACL-filtered)
- `MutationProvider` — generates create/update/delete/upsert mutations
- `EntityTypeProvider` — builds output types respecting field-level ACL
- Schema cached per content schema hash with configurable TTL

## Key Directories

- `acl/` — PredicateFactory, PredicatesInjector, VariableInjector, Authorizator
- `mapper/` — Mapper, SelectBuilder, Inserter, Updater, DeleteExecutor, relation processors
- `schema/` — GraphQL schema builders and type providers
- `resolvers/` — ReadResolver, MutationResolver
- `inputProcessing/` — CreateInputVisitor, UpdateInputVisitor
- `input-validation/` — InputPreValidator, EntityRulesResolver
