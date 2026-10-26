# engine-content-api

Core GraphQL content API. Builds a per-project GraphQL schema from the Contember schema, resolves queries/mutations against PostgreSQL with ACL predicate injection.

## Query Flow

```
GraphQL query → JsonQueryAstFactory (graphql-json ResolveInfo → ObjectNode AST)
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

## Request Memory Budget

- The `db` service of the execution container is the request client **bound** to the `RequestMemoryBudget` without charging (`withMemoryBudget(budget, { chargeRows: false })`): every query of the request is refused once the budget is exhausted, none of them accounts rows. `Mapper.selectionDb` is the same client **charged** — route a query through it only when its rows end up in the response (`selectRows`, the many-has-many junction fetch). `SelectHydrator` charges the hydrated objects once per result.
- The budget is sticky: once exceeded, every further query throws `RequestMemoryBudgetExceededError` — a `totalCount` or unique lookup queued behind the selection that exhausted it fails with the same error, never with a connection error. `MapperFactory.transaction` also checks before it queues for a pool connection.
- `MutationResolver.transaction` turns that error into `ok: false` with `ExecutionErrorType.ResourceExhausted`, after the rollback. For `mutation { transaction { … } }` every mutation field of the transaction gets that result too, because those fields are non-null. A query is instead rejected as a whole by `engine-http` (`graphql/execution.ts`), because partial data of a read is worthless.

## ACL Enforcement

Row-level and field-level security via predicate injection into every SQL operation:
- `Authorizator` — checks static permissions (yes/no/maybe per entity/field)
- `PredicateFactory` — converts ACL permission definitions to WHERE conditions
- `PredicatesInjector` — ANDs user predicates with ACL predicates on every query
- `VariableInjector` — replaces variable references with identity-specific values

### Read-path guarding

- Every `PredicateFactory` entry point takes a required `AclScope` (`'root' | 'nested'`). `nested` resolves against the set that adds the `through` grants; `root` against the root grants only. Derive it from the relation path with `aclScopeFromPath` (or the `*Read*` helpers taking `relationPath`), never by hand. Writes follow the same rule: `MutationResolver` passes `root`, the relation processors pass `nested` - including their by-unique lookups (`Mapper.getPrimaryValue`, `Mapper.selectField`), which otherwise miss rows readable only via `through`. Exception: the row an update, delete or upsert names is always located in `ROW_LOOKUP_SCOPE` (`nested`), also for a root mutation; its write predicates and the returned node keep the mutation's scope.
- Projection cell-masking happens during JS hydration (`SelectBuilder` maps `row => predicateGetter(row) ? row[alias] : null`), not in SQL. The predicate boolean column is also consumed by relation fetching (`getColumnValues`) and by the hydrator, so moving the mask into the SQL expression is not a local change.
- **`WhereOptimizer`'s `isLast` handling is deliberately conservative.** The obvious one-line "fix" (`Number(i) === relationPath.length` → `- 1`) drops the has-many `EXISTS` requirement, collapsing `{ articles: { author: { id: { isNull: false } } } }` to `{ id: { always: true } }` — an over-match. Verified empirically; it needs a real optimizer change, not a tweak.

## GraphQL Schema Building

The content API runs on `@contember/graphql-json`: the schema is plain JSON (tuples), no graphql-js type instances.
`JsonContentSchemaBuilder` (`schema-json/`) builds it per role combination from `JsonEntityTypes`, `JsonFilterTypes`,
`JsonInputTypes` and `JsonColumnTypes`, registered in `JsonTypeRegistry`.

- **The published schema is a contract.** Type order, field order, descriptions and deprecations are what clients see in introspection and in `contember project print-schema`. `getReachableTypes` collects types in graphql-js order on purpose; the SDL fixtures in `tests/cases/integration/graphQlSchema/*.gql` and the response snapshots in `engine-http` (`contentGraphqlCompat.test.ts`) were recorded on the former graphql-js builder and must not drift.
- Role schemas of one model share a `JsonContentSchemaShared` (resolvers, field extensions, scalars, `SchemaInterner`), so a role costs only the types its permissions change. Resolvers are module-level factories: a closure over the builder would keep it alive in the shared map.
- Plugin contributions stay graphql-js (`GraphQLSchemaContributor`); `GraphQLJsBridge` converts them and delegates their root fields to graphql-js execution.
- Schema cached per content schema hash with configurable TTL (`engine-http` `GraphQlSchemaFactory`).

## Key Directories

- `acl/` — PredicateFactory, PredicatesInjector, VariableInjector, Authorizator
- `mapper/` — Mapper, SelectBuilder, Inserter, Updater, DeleteExecutor, relation processors
- `schema-json/` — the content schema builder for graphql-json
- `schema/` — helpers shared by the builder and the resolvers (operation meta, field access, custom scalars)
- `resolvers/` — ReadResolver, MutationResolver
- `inputProcessing/` — CreateInputVisitor, UpdateInputVisitor
- `input-validation/` — InputPreValidator, EntityRulesResolver
